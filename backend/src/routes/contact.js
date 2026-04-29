import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { sendEmail } from "../services/emailService.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const contactSchema = z.object({
  name:    z.string().min(2, "Le nom est requis"),
  email:   z.string().email("Email invalide"),
  subject: z.string().min(3, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit comporter au moins 10 caractères"),
});

// ── POST / — public submission ──────────────────────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = contactSchema.parse(req.body);

    // Persist to DB
    await query(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
      [name, email, subject, message]
    );

    const adminEmail =
      process.env.CONTACT_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "eventflow@trugroup.cm";

    const safeMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08);">
    <div style="background:#f97316;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">EventFlow</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Nouveau message de contact</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444;">
        <tr><td style="padding:6px 0;color:#888;width:90px;">De</td><td style="font-weight:600;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Email</td><td><a href="mailto:${email}" style="color:#f97316;">${email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Sujet</td><td>${subject}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${safeMsg}</div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      EventFlow · Formulaire de contact
    </div>
  </div>
</body></html>`;

    sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject} — ${name}`,
      html,
      text: `De : ${name} <${email}>\nSujet : ${subject}\n\n${message}`,
    }).catch(() => {});

    // Auto-reply
    const autoHtml = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08);">
    <div style="background:#f97316;padding:24px 32px;"><p style="margin:0;color:#fff;font-size:20px;font-weight:700;">EventFlow</p></div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Message bien reçu, ${name} !</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;">Merci de nous avoir contactés. Nous avons bien reçu votre message concernant <strong>"${subject}"</strong> et nous vous répondrons dans les plus brefs délais.</p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">EventFlow · La plateforme événementielle africaine</div>
  </div>
</body></html>`;

    sendEmail({
      to: email,
      subject: "Nous avons bien reçu votre message — EventFlow",
      html: autoHtml,
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message et nous vous répondrons rapidement.\n\nL'équipe EventFlow`,
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    if (err?.name === "ZodError") return next(httpError(400, err.errors[0]?.message || "Données invalides"));
    next(err);
  }
});

// ── GET / — admin list ──────────────────────────────────────────────────────
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const { status, limit = 100 } = req.query;
    let sql = "SELECT * FROM contact_messages";
    const params = [];
    if (status) {
      params.push(status);
      sql += ` WHERE status = $1`;
    }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(Number(limit) || 100, 500));
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── GET /stats — unread count for sidebar badge ─────────────────────────────
router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS unread FROM contact_messages WHERE status = 'unread'`
    );
    res.json({ unread: rows[0]?.unread || 0 });
  } catch (err) { next(err); }
});

// ── PATCH /:id — update status / notes ─────────────────────────────────────
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["status", "admin_notes", "replied_at"];
    const updates = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
    if (!updates.length) return next(httpError(400, "No valid fields"));
    const set = updates.map(([k], i) => `${k} = $${i + 1}`).join(", ");
    const vals = updates.map(([, v]) => v);
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE contact_messages SET ${set}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return next(httpError(404, "Not found"));
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /:id ─────────────────────────────────────────────────────────────
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM contact_messages WHERE id = $1", [req.params.id]);
    if (!rowCount) return next(httpError(404, "Not found"));
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
