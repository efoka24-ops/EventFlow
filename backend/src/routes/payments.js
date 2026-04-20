import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";
import {
  campayCreatePaymentLink,
  campayGetTransactionStatus,
  campayRequestPayment,
  mapCampayStatusToLocal,
} from "../services/campay.js";

const router = Router();

// Accept 6XXXXXXXX (9 digits) or 2376XXXXXXXX (12 digits)
const normalizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("237")) return digits;
  if (digits.startsWith("6") && digits.length === 9) return `237${digits}`;
  return digits; // pass through and let CamPay validate
};
const phoneRegex = /^(2376\d{8}|6\d{8})$/;

const collectSchema = z.object({
  registration_id: z.string().uuid().optional(),
  event_id: z.string().min(1),
  amount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  phone_number: z.string().min(8),
  description: z.string().min(1),
  currency: z.string().default("XAF"),
  external_reference: z.string().uuid().optional(),
  external_user: z.string().optional(),
});

const linkSchema = z.object({
  registration_id: z.string().uuid().optional(),
  event_id: z.string().uuid(),
  amount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  description: z.string().min(1),
  currency: z.literal("XAF").default("XAF"),
  phone_number: z.string().regex(phoneRegex).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  external_reference: z.string().uuid().optional(),
  redirect_url: z.string().url(),
  failure_redirect_url: z.string().url().optional(),
  payment_options: z.string().default("MOMO"),
  payer_can_pay_more: z.enum(["yes", "no"]).default("no"),
});

const webhookSchema = z.object({
  reference: z.string().uuid(),
  external_reference: z.string().uuid().optional().nullable(),
  status: z.string(),
  amount: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  operator: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  operator_reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  endpoint: z.string().optional().nullable(),
});

const memPayments = new Map();

const dbTryQuery = async (...args) => {
  try {
    return await query(...args);
  } catch (e) {
    return null; // DB unavailable
  }
};

const persistPaymentEvent = async (paymentId, source, payload) => {
  await dbTryQuery(
    `INSERT INTO payment_events (payment_id, source, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [paymentId, source, source, JSON.stringify(payload)]
  );
};

router.post("/collect", async (req, res, next) => {
  try {
    const payload = collectSchema.parse(req.body);
    payload.phone_number = normalizePhone(payload.phone_number);
    const amount = Number(payload.amount);
    const externalReference = payload.external_reference || randomUUID();
    const paymentId = randomUUID();
    const now = new Date().toISOString();

    const inserted = await dbTryQuery(
      `INSERT INTO payments (
        registration_id, event_id, provider, endpoint, amount, currency,
        phone_number, description, external_reference, status_local
      ) VALUES ($1,$2,'campay','collect',$3,$4,$5,$6,$7,'initiated')
      RETURNING *`,
      [
        payload.registration_id || null,
        payload.event_id,
        amount,
        payload.currency,
        payload.phone_number,
        payload.description,
        externalReference,
      ]
    );

    const payment = inserted?.rows?.[0] ?? {
      id: paymentId,
      registration_id: payload.registration_id || null,
      event_id: payload.event_id,
      provider: "campay",
      endpoint: "collect",
      amount,
      currency: payload.currency,
      phone_number: payload.phone_number,
      description: payload.description,
      external_reference: externalReference,
      status_local: "initiated",
      created_date: now,
    };
    if (!inserted) memPayments.set(payment.id, payment);

    const campayResponse = await campayRequestPayment({
      amount: String(amount),
      currency: payload.currency,
      from: payload.phone_number,
      description: payload.description,
      external_reference: externalReference,
      external_user: payload.external_user || "",
    });

    const updated = await dbTryQuery(
      `UPDATE payments
       SET campay_reference = $1,
           ussd_code = $2,
           operator = $3,
           status_local = 'pending',
           status_provider = 'PENDING',
           provider_response = $4::jsonb
       WHERE id = $5
       RETURNING *`,
      [
        campayResponse.reference,
        campayResponse.ussd_code || null,
        campayResponse.operator || null,
        JSON.stringify(campayResponse),
        payment.id,
      ]
    );

    const finalPayment = updated?.rows?.[0] ?? {
      ...payment,
      campay_reference: campayResponse.reference,
      ussd_code: campayResponse.ussd_code || null,
      operator: campayResponse.operator || null,
      status_local: "pending",
      status_provider: "PENDING",
    };
    if (!updated) memPayments.set(finalPayment.id, finalPayment);

    await persistPaymentEvent(payment.id, "collect_initiated", campayResponse);

    res.status(201).json({ payment: finalPayment });
  } catch (err) {
    if (String(err.message || "").includes("uq_payments_external_reference")) {
      return next(httpError(409, "Duplicate external_reference"));
    }
    next(err);
  }
});

router.post("/link", async (req, res, next) => {
  try {
    const payload = linkSchema.parse(req.body);
    const amount = Number(payload.amount);
    const externalReference = payload.external_reference || randomUUID();

    const inserted = await query(
      `INSERT INTO payments (
        registration_id, event_id, provider, endpoint, amount, currency,
        phone_number, description, external_reference, status_local
      ) VALUES ($1,$2,'campay','payment_link',$3,$4,$5,$6,$7,'initiated')
      RETURNING *`,
      [
        payload.registration_id || null,
        payload.event_id,
        amount,
        payload.currency,
        payload.phone_number || null,
        payload.description,
        externalReference,
      ]
    );

    const payment = inserted.rows[0];

    const campayResponse = await campayCreatePaymentLink({
      amount: String(amount),
      currency: payload.currency,
      from: payload.phone_number || undefined,
      description: payload.description,
      first_name: payload.first_name || undefined,
      last_name: payload.last_name || undefined,
      email: payload.email || undefined,
      external_reference: externalReference,
      redirect_url: payload.redirect_url,
      failure_redirect_url: payload.failure_redirect_url || payload.redirect_url,
      payment_options: payload.payment_options,
      payer_can_pay_more: payload.payer_can_pay_more,
    });

    const updated = await query(
      `UPDATE payments
       SET campay_reference = $1,
           payment_link = $2,
           status_local = 'pending',
           status_provider = 'PENDING',
           provider_response = $3::jsonb
       WHERE id = $4
       RETURNING *`,
      [
        campayResponse.reference,
        campayResponse.link || null,
        JSON.stringify(campayResponse),
        payment.id,
      ]
    );

    await persistPaymentEvent(payment.id, "payment_link_created", campayResponse);

    res.status(201).json(updated.rows[0]);
  } catch (err) {
    if (String(err.message || "").includes("uq_payments_external_reference")) {
      return next(httpError(409, "Duplicate external_reference"));
    }
    next(err);
  }
});

router.get("/:id/status", async (req, res, next) => {
  try {
    const found = await dbTryQuery("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    const payment = found?.rows?.[0] ?? memPayments.get(req.params.id);
    if (!payment) return next(httpError(404, "Payment not found"));

    if (!payment.campay_reference) return res.json(payment);

    const providerStatus = await campayGetTransactionStatus(payment.campay_reference);
    const localStatus = mapCampayStatusToLocal(providerStatus.status);

    const updated = await dbTryQuery(
      `UPDATE payments
       SET status_local = $1,
           status_provider = $2,
           provider_code = $3,
           provider_reason = $4,
           operator = COALESCE($5, operator),
           provider_response = $6::jsonb,
           paid_at = CASE WHEN $1 = 'successful' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
       WHERE id = $7
       RETURNING *`,
      [
        localStatus,
        providerStatus.status || null,
        providerStatus.code || null,
        providerStatus.reason || null,
        providerStatus.operator || null,
        JSON.stringify(providerStatus),
        payment.id,
      ]
    );

    const finalPayment = updated?.rows?.[0] ?? { ...payment, status_local: localStatus, status_provider: providerStatus.status };
    if (!updated) memPayments.set(finalPayment.id, finalPayment);

    await persistPaymentEvent(payment.id, "status_polled", providerStatus);

    res.json({ payment: finalPayment });
  } catch (err) {
    next(err);
  }
});

router.get("/reference/:reference", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM payments WHERE campay_reference = $1 LIMIT 1", [req.params.reference]);
    if (!result.rowCount) return next(httpError(404, "Payment not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/webhook/campay", async (req, res, next) => {
  try {
    const payload = webhookSchema.parse(req.body || {});
    const localStatus = mapCampayStatusToLocal(payload.status);

    const result = await query("SELECT * FROM payments WHERE campay_reference = $1 LIMIT 1", [payload.reference]);
    if (!result.rowCount) {
      return res.status(202).json({ accepted: true, message: "No matching payment yet" });
    }

    const payment = result.rows[0];

    const updated = await query(
      `UPDATE payments
       SET status_local = $1,
           status_provider = $2,
           provider_code = $3,
           provider_reason = $4,
           operator = COALESCE($5, operator),
           operator_reference = COALESCE($6, operator_reference),
           provider_response = $7::jsonb,
           paid_at = CASE WHEN $1 = 'successful' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
       WHERE id = $8
       RETURNING *`,
      [
        localStatus,
        payload.status,
        payload.code || null,
        payload.reason || null,
        payload.operator || null,
        payload.operator_reference || null,
        JSON.stringify(payload),
        payment.id,
      ]
    );

    await persistPaymentEvent(payment.id, "webhook", payload);

    res.json({ success: true, payment: updated.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const result = await dbTryQuery("SELECT * FROM payments ORDER BY created_date DESC LIMIT 1000");
    const dbRows = result?.rows ?? [];
    const memRows = [...memPayments.values()];
    const all = [...dbRows, ...memRows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    res.json(all);
  } catch (err) {
    next(err);
  }
});

export default router;
