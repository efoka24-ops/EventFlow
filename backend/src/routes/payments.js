import { Router } from "express";
import { randomUUID } from "node:crypto";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config } from "../config.js";
import { query } from "../db.js";
import { httpError } from "../utils/httpError.js";
import {
  etCreateCheckoutLink,
  etGetTransactionStatus,
  mapEtStatusToLocal,
} from "../services/easytransact.js";

const router = Router();

const collectSchema = z.object({
  registration_id: z.string().uuid().optional(),
  event_id: z.string().min(1),
  amount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  description: z.string().min(1),
  currency: z.string().default("XAF"),
  external_reference: z.string().uuid().optional(),
  redirect_url: z.string().url().optional(),
  failure_redirect_url: z.string().url().optional(),
  payer_name: z.string().max(200).optional(),
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEM_FILE = join(__dirname, "../../.payments-mem.json");

const loadMemPayments = () => {
  try {
    if (existsSync(MEM_FILE)) {
      const raw = JSON.parse(readFileSync(MEM_FILE, "utf8"));
      return new Map(Object.entries(raw));
    }
  } catch { /* ignore */ }
  return new Map();
};

const memPayments = loadMemPayments();

const saveMemPayments = () => {
  try {
    writeFileSync(MEM_FILE, JSON.stringify(Object.fromEntries(memPayments)), "utf8");
  } catch { /* ignore */ }
};

const dbTryQuery = async (...args) => {
  try {
    return await query(...args);
  } catch {
    return null;
  }
};

const persistPaymentEvent = async (paymentId, source, payload) => {
  await dbTryQuery(
    `INSERT INTO payment_events (payment_id, source, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [paymentId, source, source, JSON.stringify(payload)]
  );
};

// POST /collect — creates a hosted checkout link via Easy Transact
router.post("/collect", async (req, res, next) => {
  try {
    const payload = collectSchema.parse(req.body);
    const amount = Number(payload.amount);
    if (amount < 100) {
      return next(httpError(400, `Montant insuffisant. Le minimum est 100 FCFA (reçu : ${amount} FCFA).`));
    }
    const externalReference = payload.external_reference || randomUUID();
    const paymentId = randomUUID();
    const now = new Date().toISOString();

    const successUrl = payload.redirect_url || `${config.corsOrigin}/payment/success`;
    const cancelUrl = payload.failure_redirect_url || `${config.corsOrigin}/payment/cancel`;

    const inserted = await dbTryQuery(
      `INSERT INTO payments (
        registration_id, event_id, provider, endpoint, amount, currency,
        description, external_reference, status_local
      ) VALUES ($1,$2,'easytransact','checkout-link',$3,$4,$5,$6,'initiated')
      RETURNING *`,
      [
        payload.registration_id || null,
        payload.event_id,
        amount,
        payload.currency,
        payload.description,
        externalReference,
      ]
    );

    const payment = inserted?.rows?.[0] ?? {
      id: paymentId,
      registration_id: payload.registration_id || null,
      event_id: payload.event_id,
      provider: "easytransact",
      endpoint: "checkout-link",
      amount,
      currency: payload.currency,
      description: payload.description,
      external_reference: externalReference,
      status_local: "initiated",
      created_date: now,
    };
    if (!inserted) { memPayments.set(payment.id, payment); saveMemPayments(); }

    const etResponse = await etCreateCheckoutLink({
      amount,
      description: payload.description,
      vendor_reference: externalReference,
      currency_code: payload.currency,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    const updated = await dbTryQuery(
      `UPDATE payments
       SET campay_reference = $1,
           status_local = 'initiated',
           status_provider = $2,
           provider_response = $3::jsonb
       WHERE id = $4
       RETURNING *`,
      [
        etResponse.payment_link_id || externalReference,
        etResponse.status || null,
        JSON.stringify(etResponse),
        payment.id,
      ]
    );

    const finalPayment = updated?.rows?.[0] ?? {
      ...payment,
      campay_reference: etResponse.payment_link_id || externalReference,
      status_provider: etResponse.status || null,
    };
    if (!updated) { memPayments.set(finalPayment.id, finalPayment); saveMemPayments(); }

    await persistPaymentEvent(payment.id, "checkout_link_created", etResponse);

    res.status(201).json({
      payment: finalPayment,
      checkout_url: etResponse.checkout_url,
    });
  } catch (err) {
    if (String(err.message || "").includes("uq_payments_external_reference")) {
      return next(httpError(409, "Duplicate external_reference"));
    }
    next(err);
  }
});

// GET /:id/status — polls Easy Transact for transaction status
router.get("/:id/status", async (req, res, next) => {
  try {
    const found = await dbTryQuery("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    const memById = memPayments.get(req.params.id);
    const memByRef = !memById ? [...memPayments.values()].find(p => p.campay_reference === req.params.id) : null;
    const payment = found?.rows?.[0] ?? memById ?? memByRef;
    if (!payment) return next(httpError(404, "Payment not found"));

    const vendorRef = payment.external_reference || payment.campay_reference;
    if (!vendorRef) return res.json({ payment });

    const providerStatus = await etGetTransactionStatus(vendorRef);
    const localStatus = mapEtStatusToLocal(providerStatus.status);

    const updated = await dbTryQuery(
      `UPDATE payments
       SET status_local = $1,
           status_provider = $2,
           operator = COALESCE($3, operator),
           provider_response = $4::jsonb,
           paid_at = CASE WHEN $1 = 'successful' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
       WHERE id = $5
       RETURNING *`,
      [
        localStatus,
        providerStatus.status || null,
        providerStatus.operator_id || null,
        JSON.stringify(providerStatus),
        payment.id,
      ]
    );

    const finalPayment = updated?.rows?.[0] ?? { ...payment, status_local: localStatus, status_provider: providerStatus.status };
    if (!updated) { memPayments.set(finalPayment.id, finalPayment); saveMemPayments(); }

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

// POST /webhook/easytransact — receives ET payment callbacks
router.post("/webhook/easytransact", async (req, res, next) => {
  try {
    const body = req.body || {};
    const vendorRef = body.vendor_reference || body.reference;
    const localStatus = mapEtStatusToLocal(body.status);

    const result = await dbTryQuery(
      "SELECT * FROM payments WHERE external_reference = $1 OR campay_reference = $1 LIMIT 1",
      [vendorRef]
    );
    if (!result?.rowCount) {
      return res.status(202).json({ accepted: true, message: "No matching payment" });
    }

    const payment = result.rows[0];
    const updated = await dbTryQuery(
      `UPDATE payments
       SET status_local = $1,
           status_provider = $2,
           operator = COALESCE($3, operator),
           provider_response = $4::jsonb,
           paid_at = CASE WHEN $1 = 'successful' THEN COALESCE(paid_at, NOW()) ELSE paid_at END
       WHERE id = $5
       RETURNING *`,
      [localStatus, body.status, body.operator_id || null, JSON.stringify(body), payment.id]
    );

    await persistPaymentEvent(payment.id, "webhook", body);
    res.json({ success: true, payment: updated?.rows?.[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await dbTryQuery("SELECT * FROM payments ORDER BY created_date DESC LIMIT 1000");
    const dbRows = result?.rows ?? [];
    const memRows = [...memPayments.values()];
    const dbIds = new Set(dbRows.map(r => r.id));
    const uniqueMemRows = memRows.filter(r => !dbIds.has(r.id));
    const all = [...dbRows, ...uniqueMemRows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    res.json(all);
  } catch (err) {
    next(err);
  }
});

export default router;
