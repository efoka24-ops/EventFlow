import nodemailer from "nodemailer";

const buildFromAddress = () => {
  const rawFrom = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  const fromName = String(process.env.SMTP_FROM_NAME || "NoReply EventFlow").trim();

  if (!rawFrom) return null;
  if (rawFrom.includes("<") && rawFrom.includes(">")) return rawFrom;

  return `${fromName} <${rawFrom}>`;
};

const createTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const getSmtpConfigStatus = () => ({
  configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  host: process.env.SMTP_HOST || null,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  user: process.env.SMTP_USER || null,
  from: buildFromAddress(),
});

export const verifySmtpConnection = async () => {
  const transporter = createTransport();
  const status = getSmtpConfigStatus();

  if (!transporter) {
    return {
      ok: false,
      reason: "smtp_not_configured",
      ...status,
    };
  }

  try {
    await transporter.verify();
    return {
      ok: true,
      reason: null,
      ...status,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error?.message || "smtp_verification_failed",
      ...status,
    };
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransport();

  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping send for:", to);
    return { skipped: true };
  }

  const from = buildFromAddress();
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return { messageId: info.messageId };
};

export const buildParticipantEmailHtml = ({ subject, body, eventTitle, organizerName }) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08);">
    <div style="background:#f97316;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">EventFlow</p>
      ${eventTitle ? `<p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px;">${eventTitle}</p>` : ""}
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111;">${subject}</h2>
      <div style="color:#444;font-size:15px;line-height:1.7;white-space:pre-wrap;">${body}</div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
      ${organizerName ? `Message envoyé par <strong>${organizerName}</strong> via ` : ""}EventFlow · La plateforme événementielle africaine
    </div>
  </div>
</body>
</html>`;
