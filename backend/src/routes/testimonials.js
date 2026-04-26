import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin, requireRole } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

// ── Public endpoint ───────────────────────────────────────────────────────────

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, role, city, emoji, quote, stars, sort_order
       FROM testimonials
       WHERE is_active = true
       ORDER BY sort_order ASC, created_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── Admin endpoints ───────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2).max(80),
  role: z.string().min(2).max(100),
  city: z.string().max(60).optional().or(z.literal("")),
  emoji: z.string().max(10).optional().or(z.literal("")),
  quote: z.string().min(10).max(500),
  stars: z.number().int().min(1).max(5).default(5),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM testimonials ORDER BY sort_order ASC, created_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/admin", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const result = await query(
      `INSERT INTO testimonials (name, role, city, emoji, quote, stars, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.name, data.role, data.city || null, data.emoji || "🎤", data.quote, data.stars, data.is_active, data.sort_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return next(httpError(400, err.errors[0].message));
    next(err);
  }
});

router.patch("/admin/:id", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    const partial = schema.partial().parse(req.body);
    const fields = Object.entries(partial).filter(([, v]) => v !== undefined);
    if (!fields.length) return next(httpError(400, "Aucune modification"));

    const sets = fields.map(([k], i) => `${k} = $${i + 2}`);
    const values = fields.map(([, v]) => v);
    const result = await query(
      `UPDATE testimonials SET ${sets.join(", ")}, updated_date = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    if (!result.rowCount) return next(httpError(404, "Témoignage non trouvé"));
    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return next(httpError(400, err.errors[0].message));
    next(err);
  }
});

router.patch("/admin/:id/toggle", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE testimonials SET is_active = NOT is_active, updated_date = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rowCount) return next(httpError(404, "Témoignage non trouvé"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/admin/:id", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    await query(`DELETE FROM testimonials WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
