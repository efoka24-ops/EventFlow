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
  "registration_config",
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

// List columns — description truncated to 220 chars for card previews; full text via /:id
const LIST_COLUMNS = `
  id, title, category, status, approval_status,
  date_start, date_end, city, location_name,
  image_url, price, max_participants, tags,
  organizer_name, organizer_email, organizer_phone,
  submitted_by_user, is_featured, created_date, updated_date,
  registration_config,
  LEFT(description, 220) AS description
`;

router.get("/", async (req, res, next) => {
  try {
    const { sort, limit, fields, ...rawFilters } = req.query;
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

    // Pass ?fields=full to get all columns (e.g. admin views that need description)
    const columns = fields === "full" ? "*" : LIST_COLUMNS;

    const sql = `
      SELECT ${columns}
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
      `SELECT ${LIST_COLUMNS}
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

// Shared ownership check: admin always passes; creator must own the event
const requireEventOwnership = async (req, res, next) => {
  const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "finance", "marketing", "moderator"]);
  if (ADMIN_ROLES.has(req.user?.role)) return next();

  // Creator: verify ownership by email or phone
  const email = String(req.user?.email || "").trim().toLowerCase();
  const phone = String(req.user?.phone || "").trim();

  const event = await query(
    `SELECT id FROM events WHERE id = $1 AND submitted_by_user = true
     AND (
       (LOWER(organizer_email) = LOWER($2) AND $2 <> '') OR
       (organizer_phone = $3 AND $3 <> '')
     )`,
    [req.params.id, email, phone]
  ).catch(() => null);

  if (!event?.rowCount) {
    return next(httpError(403, "Vous n'êtes pas autorisé à modifier cet événement"));
  }
  next();
};

// Fields creators are NOT allowed to change (e.g. approval_status, is_featured)
const CREATOR_LOCKED_FIELDS = new Set(["approval_status", "is_featured", "submitted_by_user"]);

// Timestamp columns that must not receive empty strings (convert "" → null)
const DATE_FIELDS = new Set(["date_start", "date_end"]);
const sanitizeValue = (key, value) =>
  DATE_FIELDS.has(key) && value === "" ? null : value;

const buildUpdates = (body, isAdmin) =>
  Object.entries(body || {})
    .filter(([key, value]) => {
      if (!writableFields.includes(key) || value === undefined) return false;
      if (!isAdmin && CREATOR_LOCKED_FIELDS.has(key)) return false;
      return true;
    })
    .map(([key, value]) => [key, sanitizeValue(key, value)]);

router.put("/:id", requireAuth, requireEventOwnership, async (req, res, next) => {
  try {
    const isAdmin = ["super_admin", "admin", "moderator"].includes(req.user?.role);
    const updates = buildUpdates(req.body, isAdmin);

    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = [...updates.map(([, value]) => value), req.params.id];

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

router.patch("/:id", requireAuth, requireEventOwnership, async (req, res, next) => {
  try {
    const isAdmin = ["super_admin", "admin", "moderator"].includes(req.user?.role);
    const updates = buildUpdates(req.body, isAdmin);

    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = [...updates.map(([, value]) => value), req.params.id];

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

router.delete("/:id", requireAuth, requireEventOwnership, async (req, res, next) => {
  try {
    // Prevent deletion if there are confirmed/paid registrations
    const hasRegs = await query(
      `SELECT 1 FROM registrations WHERE event_id = $1 AND status IN ('validee', 'en_attente') LIMIT 1`,
      [req.params.id]
    );
    if (hasRegs.rowCount && !["super_admin", "admin"].includes(req.user?.role)) {
      return next(httpError(409, "Impossible de supprimer un événement avec des inscriptions actives"));
    }

    const result = await query("DELETE FROM events WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Event not found"));
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
