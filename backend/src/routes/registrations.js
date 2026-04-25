import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { buildWhereClause, parseLimit, parseSort } from "../utils/queryHelpers.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const registrationSchema = z.object({
  event_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["homme", "femme", "autre"]).optional(),
  id_type: z.enum(["cni", "passeport", "permis", "autre"]).optional(),
  id_number: z.string().optional(),
  geo_latitude: z.number().optional(),
  geo_longitude: z.number().optional(),
  geo_accuracy: z.number().optional(),
  geo_location_label: z.string().optional(),
  geo_city: z.string().optional(),
  geo_region: z.string().optional(),
  geo_country: z.string().optional(),
  email_provider: z.string().optional(),
  has_gmail_account: z.boolean().optional(),
  status: z.enum(["en_attente", "en_attente_paiement", "validee", "refusee"]).optional(),
  registration_method: z.enum(["email_auto", "formulaire"]).optional(),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { sort, limit, ...rawFilters } = req.query;
    const filters = { ...rawFilters };
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      // Users can only see their own tickets, never arbitrary emails from query params.
      const email = String(req.user?.email || "").trim().toLowerCase();
      const phone = String(req.user?.phone || "").trim();
      if (!email && !phone) return res.json([]);

      delete filters.email;
      delete filters.phone;
      if (email) filters.email = email;
      if (!email && phone) filters.phone = phone;
    }

    const { clause, values, nextIndex } = buildWhereClause(filters, [
      "id",
      "event_id",
      "email",
      "phone",
      "status",
      "registration_method",
    ]);

    const { field, direction } = parseSort(sort, ["created_date", "updated_date"], "-created_date");
    const parsedLimit = parseLimit(limit, null, 500);

    const sql = `
      SELECT *
      FROM registrations
      ${clause}
      ORDER BY ${field} ${direction}
      ${parsedLimit ? `LIMIT $${nextIndex}` : ""}
    `;

    const params = parsedLimit ? [...values, parsedLimit] : values;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = registrationSchema.parse(req.body);
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      const accountEmail = String(req.user?.email || "").trim().toLowerCase();
      const accountPhone = String(req.user?.phone || "").trim();
      if (!accountEmail) {
        return next(httpError(400, "A valid account with email is required"));
      }
      payload.email = accountEmail;
      if (accountPhone) payload.phone = accountPhone;
    }

    const fields = Object.keys(payload).filter((k) => payload[k] !== undefined && payload[k] !== "");
    const columns = fields.join(", ");
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
    const values = fields.map((f) => payload[f]);

    const result = await query(
      `INSERT INTO registrations (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const writableFields = [
      "status",
      "validated_date",
      "refused_date",
      "notification_status",
      "notification_sent_at",
      "phone",
      "email",
      "gender",
      "id_type",
      "id_number",
    ];

    const updates = Object.entries(req.body || {}).filter(
      ([key, value]) => writableFields.includes(key) && value !== undefined
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
