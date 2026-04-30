import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { buildWhereClause, parseSort } from "../utils/queryHelpers.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const schema = z.object({
  event_id: z.string().uuid(),
  event_title: z.string().optional(),
  participant_name: z.string().optional(),
  participant_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const { sort, ...rawFilters } = req.query;
    // participant_email filter is restricted to admins to prevent email enumeration
    const isAdmin = req.headers.authorization || req.cookies?.rf_token;
    const allowedFilters = isAdmin ? ["event_id", "participant_email"] : ["event_id"];
    if (!isAdmin) delete rawFilters.participant_email;
    const { clause, values } = buildWhereClause(rawFilters, allowedFilters);
    const { field, direction } = parseSort(sort, ["created_date", "rating"], "-created_date");
    // Never expose participant email to public consumers
    const columns = isAdmin ? "*" : "id, event_id, event_title, participant_name, rating, comment, created_date";
    const result = await query(`SELECT ${columns} FROM event_feedback ${clause} ORDER BY ${field} ${direction}`, values);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = schema.parse(req.body);
    const result = await query(
      `INSERT INTO event_feedback (event_id, event_title, participant_name, participant_email, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        payload.event_id,
        payload.event_title || null,
        payload.participant_name || "Anonyme",
        payload.participant_email,
        payload.rating,
        payload.comment || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM event_feedback WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return next(httpError(404, "Feedback not found"));
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

export default router;
