import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";
import { buildWhereClause, parseLimit, parseSort } from "../utils/queryHelpers.js";

const router = Router();

const writableFields = [
  "title",
  "description",
  "category",
  "date_start",
  "date_end",
  "location_name",
  "city",
  "address",
  "latitude",
  "longitude",
  "image_url",
  "max_participants",
  "price",
  "status",
  "tags",
  "submitted_by_user",
  "organizer_name",
  "organizer_email",
  "organizer_phone",
];

const createEventSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  date_start: z.string().min(1),
  city: z.string().min(1),
  description: z.string().optional(),
  date_end: z.string().optional().or(z.literal("")),
  location_name: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  image_url: z.string().optional(),
  max_participants: z.number().int().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  status: z.enum(["brouillon", "publie", "annule", "termine"]).optional(),
  tags: z.string().optional(),
  submitted_by_user: z.boolean().optional(),
  organizer_name: z.string().optional(),
  organizer_email: z.string().email().optional().or(z.literal("")),
  organizer_phone: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const { sort, limit, ...rawFilters } = req.query;
    const { clause, values, nextIndex } = buildWhereClause(rawFilters, [
      "id",
      "status",
      "category",
      "city",
      "submitted_by_user",
      "organizer_email",
    ]);

    const { field, direction } = parseSort(sort, ["created_date", "date_start", "updated_date"], "-created_date");
    const parsedLimit = parseLimit(limit, null, 200);

    const sql = `
      SELECT *
      FROM events
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

router.get("/mine/list", requireAuth, async (req, res, next) => {
  try {
    const email = String(req.user?.email || "").trim().toLowerCase();
    const phone = String(req.user?.phone || "").trim();

    if (!email && !phone) {
      return res.json([]);
    }

    const result = await query(
      `SELECT *
       FROM events
       WHERE submitted_by_user = true
         AND ((LOWER(organizer_email) = LOWER($1) AND $1 <> '') OR (organizer_phone = $2 AND $2 <> ''))
       ORDER BY created_date DESC`,
      [email, phone]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM events WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Event not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = createEventSchema.parse(req.body);
    if (req.user?.role !== "admin") {
      const accountEmail = String(req.user?.email || "").trim().toLowerCase();
      const accountPhone = String(req.user?.phone || "").trim();
      if (!accountEmail || !accountPhone) {
        return next(httpError(400, "A valid account with email and phone is required"));
      }
      payload.organizer_email = accountEmail;
      payload.organizer_phone = accountPhone;
      payload.submitted_by_user = true;
    }
    const fields = Object.keys(payload).filter((k) => payload[k] !== undefined && payload[k] !== "");
    const columns = fields.join(", ");
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
    const values = fields.map((f) => payload[f]);

    const result = await query(
      `INSERT INTO events (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updates = Object.entries(req.body || {}).filter(
      ([key, value]) => writableFields.includes(key) && value !== undefined
    );

    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = updates.map(([, value]) => value);
    values.push(req.params.id);

    const result = await query(
      `UPDATE events SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rowCount) return next(httpError(404, "Event not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updates = Object.entries(req.body || {}).filter(
      ([key, value]) => writableFields.includes(key) && value !== undefined
    );

    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = updates.map(([, value]) => value);
    values.push(req.params.id);

    const result = await query(
      `UPDATE events SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rowCount) return next(httpError(404, "Event not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM events WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Event not found"));
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
