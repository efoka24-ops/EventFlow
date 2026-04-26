import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const sponsorSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  logo_url: z.string().max(500).optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  level: z.enum(["or", "argent", "bronze", "partenaire"]).default("bronze"),
  description: z.string().max(500).optional().or(z.literal("")),
});

// GET /sponsors?event_id=xxx  — list sponsors for an event (owned by creator)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const creatorId = req.user.sub;
    const { event_id } = req.query;

    let sql = `SELECT s.* FROM event_sponsors s
               JOIN events e ON e.id = s.event_id
               WHERE s.creator_account_id = $1`;
    const params = [creatorId];

    if (event_id) {
      params.push(event_id);
      sql += ` AND s.event_id = $${params.length}`;
    }

    sql += " ORDER BY s.level, s.name";
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /sponsors
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const creatorId = req.user.sub;
    const creatorEmail = String(req.user?.email || "").trim().toLowerCase();
    const creatorPhone = String(req.user?.phone || "").trim();
    const data = sponsorSchema.parse(req.body);

    if (!creatorEmail && !creatorPhone) {
      return next(httpError(403, "Compte organisateur invalide"));
    }

    // Verify the event belongs to this creator
    const { rows: evRows } = await query(
      `SELECT id FROM events
       WHERE id = $1
         AND submitted_by_user = true
         AND ((LOWER(organizer_email) = LOWER($2) AND $2 <> '') OR (organizer_phone = $3 AND $3 <> ''))`,
      [data.event_id, creatorEmail, creatorPhone]
    );
    if (!evRows.length) return next(httpError(403, "Événement introuvable ou non autorisé"));

    const { rows } = await query(
      `INSERT INTO event_sponsors (event_id, creator_account_id, name, logo_url, website_url, level, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.event_id, creatorId, data.name, data.logo_url || null, data.website_url || null, data.level, data.description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /sponsors/:id
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const creatorId = req.user.sub;
    const { id } = req.params;
    const data = sponsorSchema.partial().parse(req.body);

    const existing = await query(
      "SELECT id FROM event_sponsors WHERE id = $1 AND creator_account_id = $2",
      [id, creatorId]
    );
    if (!existing.rows.length) return next(httpError(404, "Sponsor introuvable"));

    const fields = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = $${i++}`);
      vals.push(v ?? null);
    }
    fields.push(`updated_date = NOW()`);
    vals.push(id, creatorId);

    const { rows } = await query(
      `UPDATE event_sponsors SET ${fields.join(", ")} WHERE id = $${i++} AND creator_account_id = $${i} RETURNING *`,
      vals
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /sponsors/:id
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const creatorId = req.user.sub;
    const { id } = req.params;
    const { rowCount } = await query(
      "DELETE FROM event_sponsors WHERE id = $1 AND creator_account_id = $2",
      [id, creatorId]
    );
    if (!rowCount) return next(httpError(404, "Sponsor introuvable"));
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
