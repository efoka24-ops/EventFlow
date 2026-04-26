import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin, requireSuperAdmin, requireRole } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";
import { ensurePlatformSettings, getPlatformSettingDefault } from "../services/platformSettings.js";
import { hashPassword } from "../utils/auth.js";

const router = Router();

// All admin routes require admin auth
router.use(requireAdmin);

// ─── GLOBAL STATS (KPIs) ────────────────────────────────────────────────────

router.get("/stats", async (req, res, next) => {
  try {
    const [
      eventsResult,
      registrationsResult,
      organizersResult,
      paymentsResult,
      sessionsResult,
      pendingEventsResult,
      featuredEventsResult,
      recentActivityResult,
    ] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'publie') AS published,
        COUNT(*) FILTER (WHERE status = 'brouillon') AS draft,
        COUNT(*) FILTER (WHERE approval_status = 'pending') AS pending_approval,
        COUNT(*) FILTER (WHERE is_featured = true) AS featured,
        COUNT(*) FILTER (WHERE date_start >= NOW()) AS upcoming
      FROM events`),
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'validee') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'en_attente') AS pending,
        COUNT(*) FILTER (WHERE status = 'annulee') AS cancelled,
        COUNT(*) FILTER (WHERE created_date >= NOW() - INTERVAL '24 hours') AS last_24h,
        COUNT(*) FILTER (WHERE created_date >= NOW() - INTERVAL '7 days') AS last_7d,
        COUNT(*) FILTER (WHERE created_date >= NOW() - INTERVAL '30 days') AS last_30d
      FROM registrations`),
      query(`SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_suspended = true) AS suspended,
        COUNT(*) FILTER (WHERE is_verified = true) AS verified,
        COUNT(*) FILTER (WHERE created_date >= NOW() - INTERVAL '30 days') AS new_this_month
      FROM creator_accounts`),
      query(`SELECT
        COUNT(*) AS total,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS completed_amount,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COALESCE(SUM(amount) FILTER (WHERE created_date >= NOW() - INTERVAL '30 days' AND status = 'completed'), 0) AS last_30d_amount
      FROM payments`),
      query(`SELECT
        COUNT(*) AS total_sessions,
        COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) AS unique_ips,
        ROUND(AVG(minutes_spent)::numeric, 1) AS avg_minutes,
        COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '24 hours') AS last_24h
      FROM site_sessions`),
      query(`SELECT COUNT(*) AS count FROM events WHERE approval_status = 'pending'`),
      query(`SELECT COUNT(*) AS count FROM events WHERE is_featured = true`),
      query(`SELECT
        e.title, e.id, e.status, e.date_start, e.city,
        COUNT(r.id) AS registration_count
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_date DESC
      LIMIT 5`),
    ]);

    res.json({
      events: eventsResult.rows[0],
      registrations: registrationsResult.rows[0],
      organizers: organizersResult.rows[0],
      payments: paymentsResult.rows[0],
      sessions: sessionsResult.rows[0],
      pending_events: parseInt(pendingEventsResult.rows[0]?.count || 0),
      featured_events: parseInt(featuredEventsResult.rows[0]?.count || 0),
      recent_events: recentActivityResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Monthly growth chart data
router.get("/stats/growth", async (req, res, next) => {
  try {
    const months = parseInt(req.query.months || 6);
    const [registrationsGrowth, eventsGrowth, organizersGrowth] = await Promise.all([
      query(`SELECT
        TO_CHAR(DATE_TRUNC('month', created_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_date) AS month_date,
        COUNT(*) AS count
      FROM registrations
      WHERE created_date >= NOW() - INTERVAL '${months} months'
      GROUP BY month_date ORDER BY month_date`),
      query(`SELECT
        TO_CHAR(DATE_TRUNC('month', created_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_date) AS month_date,
        COUNT(*) AS count
      FROM events
      WHERE created_date >= NOW() - INTERVAL '${months} months'
      GROUP BY month_date ORDER BY month_date`),
      query(`SELECT
        TO_CHAR(DATE_TRUNC('month', created_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_date) AS month_date,
        COUNT(*) AS count
      FROM creator_accounts
      WHERE created_date >= NOW() - INTERVAL '${months} months'
      GROUP BY month_date ORDER BY month_date`),
    ]);
    res.json({
      registrations: registrationsGrowth.rows,
      events: eventsGrowth.rows,
      organizers: organizersGrowth.rows,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PARTICIPANTS MANAGEMENT ─────────────────────────────────────────────────

router.get("/participants", async (req, res, next) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    let sql = `
      SELECT
        LOWER(COALESCE(r.email, r.phone)) AS identifier,
        COALESCE(r.email, '') AS email,
        COALESCE(r.phone, '') AS phone,
        MAX(r.first_name || ' ' || r.last_name) AS full_name,
        COUNT(r.id) AS total_registrations,
        COUNT(r.id) FILTER (WHERE r.status = 'validee') AS confirmed,
        COUNT(r.id) FILTER (WHERE r.status = 'annulee') AS cancelled,
        MAX(r.created_date) AS last_activity,
        MIN(r.created_date) AS first_seen
      FROM registrations r
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (r.email ILIKE $${params.length} OR r.phone ILIKE $${params.length} OR r.first_name ILIKE $${params.length} OR r.last_name ILIKE $${params.length})`;
    }
    sql += ` GROUP BY LOWER(COALESCE(r.email, r.phone)), r.email, r.phone ORDER BY last_activity DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await query(sql, params);

    const countResult = await query(`SELECT COUNT(DISTINCT LOWER(COALESCE(email, phone))) AS count FROM registrations`);
    res.json({ participants: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

router.get("/participants/:email/history", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, e.title AS event_title, e.date_start, e.city, e.category
       FROM registrations r
       LEFT JOIN events e ON e.id = r.event_id
       WHERE r.email = $1 OR r.phone = $1
       ORDER BY r.created_date DESC`,
      [req.params.email]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── ORGANIZERS MANAGEMENT ───────────────────────────────────────────────────

router.get("/organizers", async (req, res, next) => {
  try {
    const { search, status, limit = 50, offset = 0 } = req.query;
    const filterParams = [];
    let filterWhere = `WHERE 1=1`;
    if (search) {
      filterParams.push(`%${search}%`);
      filterWhere += ` AND (ca.full_name ILIKE $${filterParams.length} OR ca.email ILIKE $${filterParams.length} OR ca.phone ILIKE $${filterParams.length})`;
    }
    if (status === 'suspended') filterWhere += ` AND ca.is_suspended = true`;
    else if (status === 'active') filterWhere += ` AND ca.is_suspended = false`;
    else if (status === 'verified') filterWhere += ` AND ca.is_verified = true`;

    const listParams = [...filterParams, parseInt(limit), parseInt(offset)];
    const [result, countResult] = await Promise.all([
      query(`
        SELECT
          ca.*,
          COUNT(DISTINCT e.id) AS events_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'publie') AS published_events,
          COUNT(DISTINCT r.id) AS total_registrations,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS total_revenue
        FROM creator_accounts ca
        LEFT JOIN events e ON e.organizer_email = ca.email
        LEFT JOIN registrations r ON r.event_id = e.id
        LEFT JOIN payments p ON p.registration_id = r.id
        ${filterWhere}
        GROUP BY ca.id
        ORDER BY ca.created_date DESC
        LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}
      `, listParams),
      query(`SELECT COUNT(*) AS count FROM creator_accounts ca ${filterWhere}`, filterParams),
    ]);

    res.json({ organizers: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

router.post("/organizers", requireRole("admin"), async (req, res, next) => {
  try {
    const schema = z.object({
      full_name: z.string().min(2),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().min(6).optional().or(z.literal("")),
      password: z.string().min(6),
      organizer_bio: z.string().optional(),
      organizer_website: z.string().optional(),
      organizer_category: z.string().optional(),
    }).refine((d) => d.email || d.phone, { message: "Email ou téléphone requis" });

    const data = schema.parse(req.body);
    const password_hash = await hashPassword(data.password);

    const result = await query(
      `INSERT INTO creator_accounts
        (full_name, email, phone, password, password_hash, organizer_bio, organizer_website, organizer_category)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
       RETURNING id, full_name, email, phone, created_date, is_suspended, is_verified`,
      [
        data.full_name,
        data.email || null,
        data.phone || null,
        password_hash,
        data.organizer_bio || null,
        data.organizer_website || null,
        data.organizer_category || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return next(httpError(400, err.errors[0].message));
    if (err.code === "23505") return next(httpError(409, "Un compte avec cet email ou ce téléphone existe déjà"));
    next(err);
  }
});

router.patch("/organizers/:id/suspend", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await query(
      `UPDATE creator_accounts SET is_suspended = true, suspended_at = NOW(), suspended_reason = $2, updated_date = NOW() WHERE id = $1 RETURNING id, full_name, email, is_suspended`,
      [req.params.id, reason || null]
    );
    if (!result.rows.length) return next(httpError(404, "Organizer not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/organizers/:id/unsuspend", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE creator_accounts SET is_suspended = false, suspended_at = NULL, suspended_reason = NULL, updated_date = NOW() WHERE id = $1 RETURNING id, full_name, email, is_suspended`,
      [req.params.id]
    );
    if (!result.rows.length) return next(httpError(404, "Organizer not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/organizers/:id/verify", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE creator_accounts SET is_verified = true, updated_date = NOW() WHERE id = $1 RETURNING id, full_name, email, is_verified`,
      [req.params.id]
    );
    if (!result.rows.length) return next(httpError(404, "Organizer not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/organizers/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await query(`DELETE FROM creator_accounts WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── EVENTS APPROVAL & FEATURED ─────────────────────────────────────────────

router.patch("/events/:id/approve", async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected'
    const approvalSchema = z.enum(["approved", "rejected"]);
    approvalSchema.parse(status);
    const pubStatus = status === "approved" ? "publie" : "brouillon";
    const result = await query(
      `UPDATE events SET approval_status = $2, status = $3, updated_date = NOW() WHERE id = $1 RETURNING id, title, approval_status, status`,
      [req.params.id, status, pubStatus]
    );
    if (!result.rows.length) return next(httpError(404, "Event not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/events/:id/featured", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE events SET is_featured = NOT is_featured, updated_date = NOW() WHERE id = $1 RETURNING id, title, is_featured`,
      [req.params.id]
    );
    if (!result.rows.length) return next(httpError(404, "Event not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

router.get("/categories", async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM event_categories ORDER BY sort_order, name`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/categories", requireRole("admin"), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      sort_order: z.number().int().optional(),
    });
    const data = schema.parse(req.body);
    const result = await query(
      `INSERT INTO event_categories (name, slug, description, icon, color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.name, data.slug, data.description || null, data.icon || null, data.color || '#6b7280', data.sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/categories/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const allowed = ["name", "description", "icon", "color", "sort_order", "is_active"];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.json({});
    const sets = updates.map(([k], i) => `${k} = $${i + 2}`).join(", ");
    const vals = updates.map(([, v]) => v);
    const result = await query(
      `UPDATE event_categories SET ${sets}, updated_date = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...vals]
    );
    if (!result.rows.length) return next(httpError(404, "Category not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/categories/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await query(`DELETE FROM event_categories WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── REVENUE & COMMISSIONS ───────────────────────────────────────────────────

router.get("/revenue", async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const [summary, monthly, topEvents, topOrganizers] = await Promise.all([
      query(`SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_date >= NOW() - INTERVAL '30 days'), 0) AS last_30d,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_date >= NOW() - INTERVAL '7 days'), 0) AS last_7d,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
        ROUND(AVG(amount) FILTER (WHERE status = 'completed'), 0) AS avg_transaction
      FROM payments`),
      query(`SELECT
        TO_CHAR(DATE_TRUNC('month', created_date), 'Mon YYYY') AS month,
        DATE_TRUNC('month', created_date) AS month_date,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) AS revenue,
        COUNT(*) FILTER (WHERE status = 'completed') AS transactions
      FROM payments
      WHERE created_date >= NOW() - INTERVAL '${parseInt(months)} months'
      GROUP BY month_date ORDER BY month_date`),
      query(`SELECT
        e.title, e.id, e.category,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS revenue,
        COUNT(p.id) FILTER (WHERE p.status = 'completed') AS tickets_sold
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      LEFT JOIN payments p ON p.registration_id = r.id
      GROUP BY e.id
      HAVING COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) > 0
      ORDER BY revenue DESC
      LIMIT 10`),
      query(`SELECT
        ca.full_name, ca.email, ca.id,
        COUNT(DISTINCT e.id) AS events_count,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS total_revenue
      FROM creator_accounts ca
      LEFT JOIN events e ON e.organizer_email = ca.email
      LEFT JOIN registrations r ON r.event_id = e.id
      LEFT JOIN payments p ON p.registration_id = r.id
      GROUP BY ca.id
      HAVING COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 10`),
    ]);
    res.json({
      summary: summary.rows[0],
      monthly: monthly.rows,
      top_events: topEvents.rows,
      top_organizers: topOrganizers.rows,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PLATFORM SETTINGS ───────────────────────────────────────────────────────

router.get("/settings", async (req, res, next) => {
  try {
    await ensurePlatformSettings(query);

    const { category } = req.query;
    let sql = `SELECT * FROM platform_settings`;
    const params = [];
    if (category) {
      params.push(category);
      sql += ` WHERE category = $1`;
    }
    sql += ` ORDER BY category, key`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.patch("/settings/:key", requireSuperAdmin, async (req, res, next) => {
  try {
    const { value } = req.body;
    const defaultSetting = getPlatformSettingDefault(req.params.key);
    if (defaultSetting) {
      await ensurePlatformSettings(query, [req.params.key]);
    }

    const result = await query(
      `UPDATE platform_settings SET value = $2, updated_date = NOW(), updated_by = $3 WHERE key = $1 RETURNING *`,
      [req.params.key, String(value), req.user.sub]
    );
    if (!result.rows.length) return next(httpError(404, "Setting not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── PROMO CODES ─────────────────────────────────────────────────────────────

router.get("/promo-codes", async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM promo_codes ORDER BY created_date DESC`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/promo-codes", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string().min(3).max(20).toUpperCase(),
      discount_type: z.enum(["percentage", "fixed"]),
      discount_value: z.number().positive(),
      max_uses: z.number().int().positive().optional(),
      valid_until: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const result = await query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, valid_until, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.code, data.discount_type, data.discount_value, data.max_uses || null, data.valid_until || null, req.user.sub]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/promo-codes/:id/toggle", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE promo_codes SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return next(httpError(404, "Promo code not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/promo-codes/:id", requireRole("admin", "marketing"), async (req, res, next) => {
  try {
    await query(`DELETE FROM promo_codes WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── USER REPORTS / SIGNALEMENTS ─────────────────────────────────────────────

router.get("/reports", async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `SELECT * FROM user_reports`;
    const params = [];
    if (status) { params.push(status); sql += ` WHERE status = $1`; }
    sql += ` ORDER BY created_date DESC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.patch("/reports/:id/resolve", async (req, res, next) => {
  try {
    const { status, resolution_note } = req.body;
    const result = await query(
      `UPDATE user_reports SET status = $2, resolution_note = $3, resolved_by = $4, resolved_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, status || "resolved", resolution_note || null, req.user.sub]
    );
    if (!result.rows.length) return next(httpError(404, "Report not found"));
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── ROLES & ADMIN ACCOUNTS (super_admin only) ───────────────────────────────

router.get("/roles/accounts", requireSuperAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, is_active, is_suspended, suspended_reason, last_login_at, created_date
       FROM admin_accounts
       ORDER BY
         CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
         created_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/roles/accounts", requireSuperAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      full_name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["admin", "support", "finance", "marketing", "moderator"]),
    });
    const data = schema.parse(req.body);
    const password_hash = await hashPassword(data.password);
    const result = await query(
      `INSERT INTO admin_accounts (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, full_name, email, role, is_active, created_date`,
      [data.full_name, data.email.toLowerCase(), password_hash, data.role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return next(httpError(400, err.errors[0].message));
    if (err.code === "23505") return next(httpError(409, "Un compte avec cet email existe déjà"));
    next(err);
  }
});

router.patch("/roles/accounts/:id", requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.sub) return next(httpError(400, "Vous ne pouvez pas modifier votre propre rôle"));

    const schema = z.object({
      role: z.enum(["admin", "support", "finance", "marketing", "moderator"]).optional(),
      is_active: z.boolean().optional(),
      full_name: z.string().min(2).optional(),
      is_suspended: z.boolean().optional(),
      suspended_reason: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await query(`SELECT role FROM admin_accounts WHERE id = $1`, [id]);
    if (!existing.rowCount) return next(httpError(404, "Compte non trouvé"));
    if (existing.rows[0].role === "super_admin") return next(httpError(403, "Le rôle Super Admin ne peut pas être modifié"));

    const sets = [];
    const params = [];
    if (data.role !== undefined) { params.push(data.role); sets.push(`role = $${params.length}`); }
    if (data.is_active !== undefined) { params.push(data.is_active); sets.push(`is_active = $${params.length}`); }
    if (data.full_name !== undefined) { params.push(data.full_name); sets.push(`full_name = $${params.length}`); }
    if (data.is_suspended !== undefined) { params.push(data.is_suspended); sets.push(`is_suspended = $${params.length}`); }
    if (data.suspended_reason !== undefined) { params.push(data.suspended_reason || null); sets.push(`suspended_reason = $${params.length}`); }
    if (!sets.length) return next(httpError(400, "Aucune modification"));

    params.push(id);
    const result = await query(
      `UPDATE admin_accounts SET ${sets.join(", ")}, updated_date = NOW() WHERE id = $${params.length}
       RETURNING id, full_name, email, role, is_active, is_suspended, suspended_reason`,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) return next(httpError(400, err.errors[0].message));
    next(err);
  }
});

router.delete("/roles/accounts/:id", requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.sub) return next(httpError(400, "Vous ne pouvez pas supprimer votre propre compte"));

    const existing = await query(`SELECT role FROM admin_accounts WHERE id = $1`, [id]);
    if (!existing.rowCount) return next(httpError(404, "Compte non trouvé"));
    if (existing.rows[0].role === "super_admin") return next(httpError(403, "Le compte Super Admin ne peut pas être supprimé"));

    await query(`DELETE FROM admin_accounts WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN ACTIVITY LOG ──────────────────────────────────────────────────────

router.get("/activity-log", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT al.*, aa.full_name AS admin_name, aa.email AS admin_email
       FROM admin_activity_log al
       LEFT JOIN admin_accounts aa ON aa.id = al.admin_id
       ORDER BY al.created_date DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
