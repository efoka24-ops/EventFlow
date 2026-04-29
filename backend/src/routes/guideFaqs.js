import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const faqSchema = z.object({
  question:   z.string().min(5),
  answer:     z.string().min(5),
  sort_order: z.number().int().optional().default(0),
  is_visible: z.boolean().optional().default(true),
});

// ── GET / — public: visible FAQs ────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const adminMode = req.query.admin === "true";
    const sql = adminMode
      ? "SELECT * FROM guide_faqs ORDER BY sort_order ASC, created_at ASC"
      : "SELECT * FROM guide_faqs WHERE is_visible = TRUE ORDER BY sort_order ASC, created_at ASC";
    const { rows } = await query(sql);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── POST / — admin create ────────────────────────────────────────────────────
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = faqSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO guide_faqs (question, answer, sort_order, is_visible)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.question, data.answer, data.sort_order, data.is_visible]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err?.name === "ZodError") return next(httpError(400, err.errors[0]?.message));
    next(err);
  }
});

// ── PATCH /:id — admin update ────────────────────────────────────────────────
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["question", "answer", "sort_order", "is_visible"];
    const updates = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
    if (!updates.length) return next(httpError(400, "No valid fields"));
    const set = updates.map(([k], i) => `${k} = $${i + 1}`).join(", ");
    const vals = [...updates.map(([, v]) => v), req.params.id];
    const { rows } = await query(
      `UPDATE guide_faqs SET ${set}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return next(httpError(404, "Not found"));
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /:id — admin delete ───────────────────────────────────────────────
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query("DELETE FROM guide_faqs WHERE id = $1", [req.params.id]);
    if (!rowCount) return next(httpError(404, "Not found"));
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
