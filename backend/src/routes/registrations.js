import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin, requireAuth, optionalAuth } from "../middlewares/auth.js";
import { buildWhereClause, parseLimit, parseSort } from "../utils/queryHelpers.js";
import { httpError } from "../utils/httpError.js";
import { sendEmail, buildParticipantEmailHtml } from "../services/emailService.js";

const router = Router();
const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

const registrationSchema = z.object({
  event_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["homme", "femme", "autre"]).optional(),
  id_type: z.enum(["cni", "passeport", "permis", "autre"]).optional(),
  id_number: z.string().optional(),
  geo_latitude: nullableNumber,
  geo_longitude: nullableNumber,
  geo_accuracy: nullableNumber,
  geo_location_label: nullableString,
  geo_city: nullableString,
  geo_region: nullableString,
  geo_country: nullableString,
  email_provider: z.string().optional(),
  has_gmail_account: z.boolean().optional(),
  status: z.enum(["en_attente", "en_attente_paiement", "validee", "refusee"]).optional(),
  registration_method: z.enum(["email_auto", "formulaire"]).optional(),
});

// GET /registrations — list (authenticated: admin sees all, creator sees own, else 401)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { sort, limit, ...rawFilters } = req.query;
    const filters = { ...rawFilters };
    const isAdmin = req.user?.role === "admin";
    const isCreator = req.user?.role === "creator";

    if (isCreator) {
      // Creator sees only registrations on their events
      const creatorEmail = String(req.user?.email || "").trim().toLowerCase();
      const creatorPhone = String(req.user?.phone || "").trim();

      if (!creatorEmail && !creatorPhone) {
        return res.json([]);
      }

      const { rows: myEvents } = await query(
        `SELECT id
         FROM events
         WHERE (LOWER(organizer_email) = LOWER($1) AND $1 <> '')
            OR (organizer_phone = $2 AND $2 <> '')`,
        [creatorEmail, creatorPhone]
      );
      const eventIds = myEvents.map((e) => e.id);
      if (!eventIds.length) return res.json([]);

      // If event_id filter present, validate it belongs to creator
      if (filters.event_id && !eventIds.includes(filters.event_id)) {
        return res.json([]);
      }
      if (!filters.event_id) {
        // Return all registrations for all their events
        const { field, direction } = parseSort(sort, ["created_date", "updated_date"], "-created_date");
        const parsedLimit = parseLimit(limit, null, 500);
        const inClause = eventIds.map((_, i) => `$${i + 1}`).join(", ");
        const sql = `SELECT * FROM registrations WHERE event_id IN (${inClause}) ORDER BY ${field} ${direction} ${parsedLimit ? `LIMIT $${eventIds.length + 1}` : ""}`;
        const params = parsedLimit ? [...eventIds, parsedLimit] : eventIds;
        const result = await query(sql, params);
        return res.json(result.rows);
      }
    } else if (!isAdmin) {
      return next(httpError(403, "Forbidden"));
    }

    const { clause, values, nextIndex } = buildWhereClause(filters, [
      "id", "event_id", "email", "phone", "status", "registration_method",
    ]);
    const { field, direction } = parseSort(sort, ["created_date", "updated_date"], "-created_date");
    const parsedLimit = parseLimit(limit, null, 500);
    const sql = `SELECT * FROM registrations ${clause} ORDER BY ${field} ${direction} ${parsedLimit ? `LIMIT $${nextIndex}` : ""}`;
    const params = parsedLimit ? [...values, parsedLimit] : values;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /registrations/my-tickets?email=xxx — public lookup by email (no auth needed)
router.get("/my-tickets", async (req, res, next) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const phone = String(req.query.phone || "").trim();

    if (!email && !phone) return next(httpError(400, "email or phone required"));

    let sql = `
      SELECT r.*, e.title as event_title, e.date_start, e.city, e.location_name, e.image_url as event_image,
             e.price as event_price, e.organizer_name
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE `;
    const params = [];

    if (email) {
      params.push(email);
      sql += `LOWER(r.email) = $1`;
    } else {
      params.push(phone);
      sql += `r.phone = $1`;
    }

    sql += " ORDER BY r.created_date DESC LIMIT 50";
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /registrations — public (no auth required, Eventbrite-style)
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const payload = registrationSchema.parse(req.body);
    const isAdmin = req.user?.role === "admin";

    // If creator is logged in, ensure their email is used
    if (req.user?.role === "creator" && req.user?.email) {
      payload.email = req.user.email.toLowerCase();
    }

    // Require at least email or phone for traceability
    const hasContact = (payload.email && payload.email.trim() !== "") || (payload.phone && payload.phone.trim() !== "");
    if (!isAdmin && !hasContact) {
      return next(httpError(400, "Un email ou un numéro de téléphone est requis pour s'inscrire."));
    }

    // Check for duplicate registration
    if (payload.email) {
      const { rows: dup } = await query(
        "SELECT id FROM registrations WHERE event_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1",
        [payload.event_id, payload.email]
      );
      if (dup.length) {
        return next(httpError(409, "Vous êtes déjà inscrit(e) à cet événement avec cet email."));
      }
    }

    const fields = Object.keys(payload).filter((k) => payload[k] !== undefined && payload[k] !== "");
    const columns = fields.join(", ");
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
    const values = fields.map((f) => payload[f]);

    const result = await query(
      `INSERT INTO registrations (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    const registration = result.rows[0];

    // Send confirmation email (async — don't block response)
    if (payload.email) {
      const { rows: evRows } = await query("SELECT title, date_start, city, organizer_name FROM events WHERE id = $1", [payload.event_id]);
      const ev = evRows[0];
      if (ev) {
        const subject = `Confirmation d'inscription — ${ev.title}`;
        const body = `Bonjour ${payload.first_name},\n\nVotre inscription à "${ev.title}"${ev.date_start ? ` le ${new Date(ev.date_start).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : ""}${ev.city ? ` à ${ev.city}` : ""} a bien été enregistrée.\n\nStatut : En attente de validation\n\nVous pouvez retrouver vos billets à tout moment sur :\n${process.env.CORS_ORIGIN || "http://localhost:5173"}/participant/tickets?email=${encodeURIComponent(payload.email)}\n\nMerci de votre confiance,\n${ev.organizer_name || "L'équipe EventFlow"}`;
        const html = buildParticipantEmailHtml({ subject, body: body.replace(/\n/g, "<br>"), eventTitle: ev.title, organizerName: ev.organizer_name });
        sendEmail({ to: payload.email, subject, html, text: body }).catch((e) =>
          console.warn("[email] Confirmation send failed:", e.message)
        );
      }
    }

    res.status(201).json(registration);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const isCreator = req.user?.role === "creator";

    const writableByAdmin = [
      "status", "validated_date", "refused_date",
      "notification_status", "notification_sent_at",
      "phone", "email", "gender", "id_type", "id_number",
    ];
    const writableByCreator = ["status", "validated_date", "refused_date", "notification_status", "notification_sent_at"];

    const allowed = isAdmin ? writableByAdmin : isCreator ? writableByCreator : [];
    if (!allowed.length) return next(httpError(403, "Forbidden"));

    // Creator can only update registrations on their own events
    if (isCreator) {
      const creatorEmail = String(req.user?.email || "").trim().toLowerCase();
      const creatorPhone = String(req.user?.phone || "").trim();
      const { rows } = await query(
        `SELECT r.id
         FROM registrations r
         JOIN events e ON e.id = r.event_id
         WHERE r.id = $1
           AND (
             (LOWER(e.organizer_email) = LOWER($2) AND $2 <> '')
             OR (e.organizer_phone = $3 AND $3 <> '')
           )`,
        [req.params.id, creatorEmail, creatorPhone]
      );
      if (!rows.length) return next(httpError(403, "Accès refusé"));
    }

    const updates = Object.entries(req.body || {}).filter(
      ([key, value]) => allowed.includes(key) && value !== undefined
    );
    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = updates.map(([, value]) => value);
    values.push(req.params.id);

    const result = await query(
      `UPDATE registrations SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rowCount) return next(httpError(404, "Registration not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM registrations WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Registration not found"));
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
