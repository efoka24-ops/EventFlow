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

const phoneRegex = /^2376\d{8}$/;

const collectSchema = z.object({
  registration_id: z.string().uuid().optional(),
  event_id: z.string().uuid(),
  amount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  phone_number: z.string().regex(phoneRegex, "Phone must be format 2376XXXXXXXX"),
  description: z.string().min(1),
  currency: z.literal("XAF").default("XAF"),
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

const persistPaymentEvent = async (paymentId, source, payload) => {
  await query(
    `INSERT INTO payment_events (payment_id, source, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [paymentId, source, source, JSON.stringify(payload)]
  );
};

router.post("/collect", async (req, res, next) => {
  try {
    const payload = collectSchema.parse(req.body);
    const amount = Number(payload.amount);
    const externalReference = payload.external_reference || randomUUID();

    const inserted = await query(
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

    const payment = inserted.rows[0];

    const campayResponse = await campayRequestPayment({
      amount: String(amount),
      currency: payload.currency,
      from: payload.phone_number,
      description: payload.description,
      external_reference: externalReference,
      external_user: payload.external_user || "",
    });

    const updated = await query(
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

    await persistPaymentEvent(payment.id, "collect_initiated", campayResponse);

    res.status(201).json(updated.rows[0]);
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
    const found = await query("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    if (!found.rowCount) return next(httpError(404, "Payment not found"));

    const payment = found.rows[0];
    if (!payment.campay_reference) return res.json(payment);

    const providerStatus = await campayGetTransactionStatus(payment.campay_reference);
    const localStatus = mapCampayStatusToLocal(providerStatus.status);

    const updated = await query(
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

    await persistPaymentEvent(payment.id, "status_polled", providerStatus);

    res.json(updated.rows[0]);
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
    const result = await query("SELECT * FROM payments ORDER BY created_date DESC LIMIT 1000");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
