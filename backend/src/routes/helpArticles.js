import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { parseSort } from "../utils/queryHelpers.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const schema = z.object({
  topic_id: z.string().min(1),
  topic_title: z.string().min(1),
  topic_description: z.string().optional(),
  topic_order: z.number().int().default(1),
  title: z.string().min(1),
  content: z.string().min(1),
  article_order: z.number().int().default(1),
});

router.get("/", async (req, res, next) => {
  try {
    const { field, direction } = parseSort(req.query.sort, ["topic_order", "article_order", "created_date"], "topic_order");
    const result = await query(`SELECT * FROM help_articles ORDER BY ${field} ${direction}, article_order ASC`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const result = await query(
      `INSERT INTO help_articles (topic_id, topic_title, topic_description, topic_order, title, content, article_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        payload.topic_id,
        payload.topic_title,
        payload.topic_description || null,
        payload.topic_order,
        payload.title,
        payload.content,
        payload.article_order,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = schema.partial().parse(req.body);
    const updates = Object.entries(payload).filter(([, value]) => value !== undefined);
    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    const setClause = updates.map(([key], i) => `${key} = $${i + 1}`).join(", ");
    const values = updates.map(([, value]) => value);
    values.push(req.params.id);

    const result = await query(
      `UPDATE help_articles SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rowCount) return next(httpError(404, "Help article not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM help_articles WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Help article not found"));
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
