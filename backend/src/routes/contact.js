import { Router } from "express";
import { z } from "zod";
import { sendEmail } from "../services/emailService.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  subject: z.string().min(3, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit comporter au moins 10 caractères"),
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = contactSchema.parse(req.body);

    const adminEmail =
      process.env.CONTACT_EMAIL ||
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      "eventflow@trugroup.cm";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08);">
    <div style="background:#f97316;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">EventFlow</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Nouveau message de contact</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444;">
        <tr><td style="padding:6px 0;color:#888;width:90px;">De</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#f97316;">${email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#888;">Sujet</td><td style="padding:6px 0;">${subject}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <div style="color:#333;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      EventFlow · Formulaire de contact
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject} — ${name}`,
      html,
      text: `De : ${name} <${email}>\nSujet : ${subject}\n\n${message}`,
    });

    // Auto-reply to sender
    const autoReplyHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08);">
    <div style="background:#f97316;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">EventFlow</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111;">Message bien reçu, ${name} !</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;">
        Merci de nous avoir contactés. Nous avons bien reçu votre message concernant
        <strong>"${subject}"</strong> et nous vous répondrons dans les plus brefs délais.
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px;">Votre message :<br>
        <em style="color:#555;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</em>
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      EventFlow · La plateforme événementielle africaine
    </div>
  </div>
</body>
</html>`;

    sendEmail({
      to: email,
      subject: "Nous avons bien reçu votre message — EventFlow",
      html: autoReplyHtml,
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message et nous vous répondrons rapidement.\n\nL'équipe EventFlow`,
    }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    if (err?.name === "ZodError") {
      return next(httpError(400, err.errors[0]?.message || "Données invalides"));
    }
    next(err);
  }
});

export default router;
