import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const fieldSchema = z.object({
  event_id: z.string().uuid(),
  field_key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Clé : minuscules, chiffres et underscores uniquement"),
  field_label: z.string().min(1),
  field_type: z.enum(["text", "number", "email", "tel", "select", "textarea", "date", "checkbox"]),
  field_options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional()
    .default([]),
  placeholder: z.string().optional().nullable(),
  is_required: z.boolean().optional().default(false),
  is_visible: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
});

const ALLOWED_PATCH = [
  "field_label", "field_type", "field_options",
  "placeholder", "is_required", "is_visible", "sort_order",
];

// GET /form-fields?event_id=:uuid[&include_hidden=true]
// Public : champs visibles ; admin avec include_hidden=true : tous les champs
router.get("/", async (req, res, next) => {
  try {
    const { event_id, include_hidden } = req.query;
    if (!event_id) return next(httpError(400, "Paramètre event_id manquant"));

    const visibilityClause = include_hidden === "true" ? "" : "AND is_visible = true";
    const { rows } = await query(
      `SELECT id, event_id, field_key, field_label, field_type,
              field_options, placeholder, is_required, is_visible, sort_order
       FROM event_form_fields
       WHERE event_id = $1 ${visibilityClause}
       ORDER BY sort_order ASC, created_at ASC`,
      [event_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /form-fields — admin : créer un champ
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const p = fieldSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO event_form_fields
         (event_id, field_key, field_label, field_type, field_options,
          placeholder, is_required, is_visible, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        p.event_id, p.field_key, p.field_label, p.field_type,
        JSON.stringify(p.field_options), p.placeholder ?? null,
        p.is_required, p.is_visible, p.sort_order,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err?.code === "23505")
      return next(httpError(409, `La clé "${req.body?.field_key}" existe déjà pour cet événement`));
    next(err);
  }
});

// PATCH /form-fields/:id — admin : modifier un champ
router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const entries = Object.entries(req.body || {}).filter(([k]) => ALLOWED_PATCH.includes(k));
    if (!entries.length) return next(httpError(400, "Aucun champ modifiable fourni"));

    const setClause = entries.map(([k], i) => `${k} = $${i + 1}`).join(", ");
    const values = entries.map(([k, v]) =>
      k === "field_options" ? JSON.stringify(v) : v
    );
    values.push(req.params.id);

    const { rows } = await query(
      `UPDATE event_form_fields
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${entries.length + 1}
       RETURNING *`,
      values
    );
    if (!rows.length) return next(httpError(404, "Champ introuvable"));
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /form-fields/:id — admin : supprimer un champ
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      "DELETE FROM event_form_fields WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) return next(httpError(404, "Champ introuvable"));
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
