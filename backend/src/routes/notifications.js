import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";
import { sendEmail, buildParticipantEmailHtml } from "../services/emailService.js";

const router = Router();

const sendSchema = z.object({
  event_id: z.string().uuid().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

// POST /notifications/send — send email to participants of creator's events
router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const creatorId = req.user.sub;
    const creatorEmail = String(req.user?.email || "").trim().toLowerCase();
    const creatorPhone = String(req.user?.phone || "").trim();
    const { event_id, subject, body } = sendSchema.parse(req.body);

    if (!creatorEmail && !creatorPhone) {
      return next(httpError(403, "Compte organisateur invalide"));
    }

    // Get creator name
    const { rows: creatorRows } = await query(
      "SELECT full_name FROM creator_accounts WHERE id = $1",
      [creatorId]
    );
    const organizerName = creatorRows[0]?.full_name || "L'organisateur";

    // Build target registrations
    let regSql = `SELECT r.id, r.email, r.first_name, r.last_name, e.title as event_title
                  FROM registrations r
                  JOIN events e ON e.id = r.event_id
                  WHERE e.submitted_by_user = true
                    AND ((LOWER(e.organizer_email) = LOWER($1) AND $1 <> '') OR (e.organizer_phone = $2 AND $2 <> ''))
                    AND r.email IS NOT NULL AND r.email != ''`;
    const params = [creatorEmail, creatorPhone];

    if (event_id) {
      params.push(event_id);
      regSql += ` AND r.event_id = $${params.length}`;
    }

    const { rows: targets } = await query(regSql, params);

    if (!targets.length) {
      return res.json({ sent: 0, skipped: 0, message: "Aucun participant avec email trouvé." });
    }

    const results = await Promise.allSettled(
      targets.map(async (t) => {
        const html = buildParticipantEmailHtml({
          subject,
          body: body.replace(/\n/g, "<br>"),
          eventTitle: t.event_title,
          organizerName,
        });
        await sendEmail({ to: t.email, subject, html, text: body });

        // Mark as notified
        await query(
          `UPDATE registrations SET notification_status='sent', notification_sent_at=NOW() WHERE id=$1`,
          [t.id]
        );
        return t.id;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    res.json({ sent, failed, total: targets.length });
  } catch (err) { next(err); }
});

export default router;
