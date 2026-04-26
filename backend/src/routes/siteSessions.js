import { Router } from "express";
import { z } from "zod";
import { isTransientDbError, query } from "../db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { parseLimit, parseSort } from "../utils/queryHelpers.js";

const router = Router();
const sessionIdSchema = z.string().uuid();
const nullableString = z.string().nullable().optional();
const nullableDatetime = z.string().datetime().nullable().optional();

const heartbeatSchema = z.object({
  started_at: nullableDatetime,
  ended_at: nullableDatetime,
  last_seen_at: nullableDatetime,
  is_active: z.boolean().optional(),
  page_path: nullableString,
  user_email: z.string().email().nullable().optional(),
  user_phone: nullableString,
  account_type: nullableString,
  user_agent: nullableString,
  browser: nullableString,
  browser_version: nullableString,
  browser_full: nullableString,
  os: nullableString,
  device_type: nullableString,
  language: nullableString,
  timezone: nullableString,
  screen: nullableString,
  referrer: nullableString,
  ip: nullableString,
  country: nullableString,
  city: nullableString,
  region: nullableString,
  geo_source: nullableString,
  geo_latitude: z.number().nullable().optional(),
  geo_longitude: z.number().nullable().optional(),
  geo_accuracy_m: z.number().nullable().optional(),
  geo_altitude_m: z.number().nullable().optional(),
  geo_altitude_accuracy_m: z.number().nullable().optional(),
  geo_heading_deg: z.number().nullable().optional(),
  geo_speed_mps: z.number().nullable().optional(),
  geo_timestamp: nullableDatetime,
});

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const { sort, limit } = req.query;
    const { field, direction } = parseSort(sort, ["started_at", "last_seen_at", "created_date"], "-started_at");
    const parsedLimit = parseLimit(limit, 500, 5000);
    const result = await query(`SELECT * FROM site_sessions ORDER BY ${field} ${direction} LIMIT $1`, [parsedLimit]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.put("/:id/heartbeat", async (req, res, next) => {
  try {
    sessionIdSchema.parse(req.params.id);
    const payload = heartbeatSchema.parse(req.body || {});
    const now = new Date().toISOString();

    let exists = await query("SELECT id, page_paths FROM site_sessions WHERE id = $1", [req.params.id]);

    if (!exists.rowCount) {
      const initialPaths = payload.page_path ? [payload.page_path] : [];
      try {
        const created = await query(
          `INSERT INTO site_sessions (
            id, started_at, ended_at, last_seen_at, is_active, page_paths,
            user_email, user_phone, account_type, user_agent, browser, browser_version, browser_full,
            os, device_type, language, timezone, screen, referrer, ip, country, city, region,
            geo_source, geo_latitude, geo_longitude, geo_accuracy_m, geo_altitude_m,
            geo_altitude_accuracy_m, geo_heading_deg, geo_speed_mps, geo_timestamp
          ) VALUES (
            $1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32
          ) RETURNING *`,
          [
            req.params.id,
            payload.started_at || now,
            payload.ended_at || null,
            payload.last_seen_at || now,
            payload.is_active ?? true,
            JSON.stringify(initialPaths),
            payload.user_email || null,
            payload.user_phone || null,
            payload.account_type || null,
            payload.user_agent || null,
            payload.browser || null,
            payload.browser_version || null,
            payload.browser_full || null,
            payload.os || null,
            payload.device_type || null,
            payload.language || null,
            payload.timezone || null,
            payload.screen || null,
            payload.referrer || null,
            payload.ip || null,
            payload.country || null,
            payload.city || null,
            payload.region || null,
            payload.geo_source || null,
            payload.geo_latitude ?? null,
            payload.geo_longitude ?? null,
            payload.geo_accuracy_m ?? null,
            payload.geo_altitude_m ?? null,
            payload.geo_altitude_accuracy_m ?? null,
            payload.geo_heading_deg ?? null,
            payload.geo_speed_mps ?? null,
            payload.geo_timestamp || null,
          ]
        );
        return res.json(created.rows[0]);
      } catch (err) {
        if (err?.code !== "23505") {
          throw err;
        }
        exists = await query("SELECT id, page_paths FROM site_sessions WHERE id = $1", [req.params.id]);
      }
    }

    const currentPaths = Array.isArray(exists.rows[0].page_paths) ? exists.rows[0].page_paths : [];
    const mergedPaths = payload.page_path && !currentPaths.includes(payload.page_path)
      ? [...currentPaths, payload.page_path]
      : currentPaths;

    const updated = await query(
      `UPDATE site_sessions
       SET
         started_at = COALESCE($2, started_at),
         ended_at = COALESCE($3, ended_at),
         last_seen_at = COALESCE($4, last_seen_at),
         is_active = COALESCE($5, is_active),
         page_paths = $6::jsonb,
         user_email = COALESCE($7, user_email),
         user_phone = COALESCE($8, user_phone),
         account_type = COALESCE($9, account_type),
         user_agent = COALESCE($10, user_agent),
         browser = COALESCE($11, browser),
         browser_version = COALESCE($12, browser_version),
         browser_full = COALESCE($13, browser_full),
         os = COALESCE($14, os),
         device_type = COALESCE($15, device_type),
         language = COALESCE($16, language),
         timezone = COALESCE($17, timezone),
         screen = COALESCE($18, screen),
         referrer = COALESCE($19, referrer),
         ip = COALESCE($20, ip),
         country = COALESCE($21, country),
         city = COALESCE($22, city),
         region = COALESCE($23, region),
         geo_source = COALESCE($24, geo_source),
         geo_latitude = COALESCE($25, geo_latitude),
         geo_longitude = COALESCE($26, geo_longitude),
         geo_accuracy_m = COALESCE($27, geo_accuracy_m),
         geo_altitude_m = COALESCE($28, geo_altitude_m),
         geo_altitude_accuracy_m = COALESCE($29, geo_altitude_accuracy_m),
         geo_heading_deg = COALESCE($30, geo_heading_deg),
         geo_speed_mps = COALESCE($31, geo_speed_mps),
         geo_timestamp = COALESCE($32, geo_timestamp)
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        payload.started_at || null,
        payload.ended_at ?? null,
        payload.last_seen_at || now,
        payload.is_active ?? null,
        JSON.stringify(mergedPaths),
        payload.user_email || null,
        payload.user_phone || null,
        payload.account_type || null,
        payload.user_agent || null,
        payload.browser || null,
        payload.browser_version || null,
        payload.browser_full || null,
        payload.os || null,
        payload.device_type || null,
        payload.language || null,
        payload.timezone || null,
        payload.screen || null,
        payload.referrer || null,
        payload.ip || null,
        payload.country || null,
        payload.city || null,
        payload.region || null,
        payload.geo_source || null,
        payload.geo_latitude ?? null,
        payload.geo_longitude ?? null,
        payload.geo_accuracy_m ?? null,
        payload.geo_altitude_m ?? null,
        payload.geo_altitude_accuracy_m ?? null,
        payload.geo_heading_deg ?? null,
        payload.geo_speed_mps ?? null,
        payload.geo_timestamp || null,
      ]
    );

    return res.json(updated.rows[0]);
  } catch (err) {
    if (isTransientDbError(err)) {
      return res.status(202).json({ ok: false, queued: false, reason: "analytics_db_temporarily_unavailable" });
    }
    next(err);
  }
});

export default router;
