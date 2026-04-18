import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { buildWhereClause, parseLimit, parseSort } from "../utils/queryHelpers.js";

const router = Router();

const schema = z.object({
  action: z.string().min(1),
  user_email: z.string().email().nullable().optional(),
  session_id: z.string().uuid().nullable().optional(),
  page_path: z.string().nullable().optional(),
  context: z.string().nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  event_title: z.string().nullable().optional(),
  event_category: z.string().nullable().optional(),
  metadata: z.any().optional(),
  occurred_at: z.string().datetime().optional(),
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const { sort, limit, ...rawFilters } = req.query;
    const { clause, values, nextIndex } = buildWhereClause(rawFilters, ["user_email", "action", "event_id", "session_id"]);
    const { field, direction } = parseSort(sort, ["created_date", "occurred_at"], "-created_date");
    const parsedLimit = parseLimit(limit, 500, 5000);

    const sql = `SELECT * FROM user_actions ${clause} ORDER BY ${field} ${direction} LIMIT $${nextIndex}`;
    const result = await query(sql, [...values, parsedLimit]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const result = await query(
      `INSERT INTO user_actions (action, user_email, session_id, page_path, context, event_id, event_title, event_category, metadata, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING *`,
      [
        payload.action,
        payload.user_email || null,
        payload.session_id || null,
        payload.page_path || null,
        payload.context || null,
        payload.event_id || null,
        payload.event_title || null,
        payload.event_category || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        payload.occurred_at || new Date().toISOString(),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
