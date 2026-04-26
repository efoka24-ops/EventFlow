import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { config } from "../config.js";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";
import { verifySmtpConnection } from "../services/emailService.js";

const router = Router();

const creatorSignupSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(4),
  geo_latitude: z.number().optional(),
  geo_longitude: z.number().optional(),
  geo_accuracy: z.number().optional(),
  geo_source: z.string().optional(),
  geo_captured_at: z.string().datetime().optional(),
});

const creatorLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

const creatorProfileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  current_password: z.string().min(1).optional(),
  new_password: z.string().min(4).optional(),
});

const adminLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

router.post("/creator/signup", async (req, res, next) => {
  try {
    const payload = creatorSignupSchema.parse(req.body);
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();

    const exists = await query(
      `SELECT id FROM creator_accounts WHERE (LOWER(email) = LOWER($1) AND $1 <> '') OR (phone = $2 AND $2 <> '') LIMIT 1`,
      [email, phone]
    );

    if (exists.rowCount) return next(httpError(409, "Creator account already exists"));

    const hashed = await hashPassword(payload.password);
    const created = await query(
      `INSERT INTO creator_accounts (
         full_name,
         email,
         phone,
         password_hash,
         password,
         geo_latitude,
         geo_longitude,
         geo_accuracy,
         geo_source,
         geo_captured_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, full_name, email, phone, created_date`,
      [
        payload.full_name.trim(),
        email,
        phone,
        hashed,
        payload.password,
        payload.geo_latitude ?? null,
        payload.geo_longitude ?? null,
        payload.geo_accuracy ?? null,
        payload.geo_source || null,
        payload.geo_captured_at || null,
      ]
    );

    const user = created.rows[0];
    const token = signToken({ sub: user.id, role: "creator", email: user.email || null, phone: user.phone || null });

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/creator/login", async (req, res, next) => {
  try {
    const payload = creatorLoginSchema.parse(req.body);
    const identifier = payload.identifier.trim().toLowerCase();

    const result = await query(
      `SELECT id, full_name, email, phone, password, password_hash
       FROM creator_accounts
       WHERE LOWER(email) = $1 OR phone = $2
       LIMIT 1`,
      [identifier, payload.identifier.trim()]
    );

    if (!result.rowCount) return next(httpError(401, "Invalid credentials"));

    const account = result.rows[0];
    const isValid = account.password_hash
      ? await comparePassword(payload.password, account.password_hash)
      : payload.password === account.password;

    if (!isValid) return next(httpError(401, "Invalid credentials"));

    const user = {
      id: account.id,
      full_name: account.full_name,
      email: account.email,
      phone: account.phone,
    };

    const token = signToken({ sub: user.id, role: "creator", email: user.email || null, phone: user.phone || null });
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/admin/login", async (req, res, next) => {
  try {
    const payload = adminLoginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();

    // Preferred path: authenticate against PostgreSQL admin_accounts.
    try {
      const dbAdmin = await query(
        `SELECT id, full_name, email, password_hash,
                COALESCE(role, 'admin') AS role,
                COALESCE(is_suspended, false) AS is_suspended
         FROM admin_accounts
         WHERE email = $1 AND is_active = true
         LIMIT 1`,
        [email]
      );

      if (dbAdmin.rowCount) {
        const account = dbAdmin.rows[0];
        if (account.is_suspended) return next(httpError(403, "This account has been suspended"));
        const isValid = await comparePassword(payload.password, account.password_hash);
        if (!isValid) return next(httpError(401, "Invalid admin credentials"));

        await query("UPDATE admin_accounts SET last_login_at = NOW() WHERE id = $1", [account.id]);

        const role = account.role || "admin";
        const token = signToken({ sub: account.id, role, email: account.email });
        return res.json({
          token,
          user: { id: account.id, role, email: account.email, full_name: account.full_name },
        });
      }
    } catch (dbErr) {
      // Keep compatibility before migrations are applied.
      if (dbErr?.code !== "42P01") throw dbErr;
    }

    // Compatibility fallback: env-based admin credentials.
    if (!config.adminEmail || !config.adminPassword) {
      return next(httpError(500, "Admin credentials are not configured"));
    }

    const emailOk = email === config.adminEmail.trim().toLowerCase();
    const pwdOk = payload.password === config.adminPassword;

    if (!emailOk || !pwdOk) return next(httpError(401, "Invalid admin credentials"));

    const token = signToken({ sub: "admin", role: "admin", email: config.adminEmail });
    return res.json({ token, user: { id: "admin", role: "admin", email: config.adminEmail } });
  } catch (err) {
    next(err);
  }
});

const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "finance", "marketing", "moderator"]);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (ADMIN_ROLES.has(req.user.role)) {
      try {
        const result = await query(
          `SELECT id, full_name, email, role, is_active, last_login_at FROM admin_accounts WHERE id = $1 LIMIT 1`,
          [req.user.sub]
        );
        if (result.rowCount) {
          const a = result.rows[0];
          return res.json({ id: a.id, role: a.role, email: a.email, full_name: a.full_name });
        }
      } catch (dbErr) {
        if (dbErr?.code !== "42P01") throw dbErr;
      }
      // fallback for env-based admin or pre-migration
      return res.json({ id: req.user.sub || "admin", role: req.user.role, email: req.user.email || config.adminEmail });
    }

    const result = await query(
      "SELECT id, full_name, email, phone, created_date FROM creator_accounts WHERE id = $1 LIMIT 1",
      [req.user.sub]
    );

    if (!result.rowCount) return next(httpError(404, "User not found"));
    return res.json({ ...result.rows[0], role: "creator" });
  } catch (err) {
    next(err);
  }
});

router.get("/smtp-health", requireAdmin, async (_req, res, next) => {
  try {
    const status = await verifySmtpConnection();
    res.status(status.ok ? 200 : 503).json(status);
  } catch (err) {
    next(err);
  }
});

router.patch("/creator/me", requireAuth, async (req, res, next) => {
  try {
    if (req.user?.role === "admin") return next(httpError(403, "Creator account required"));

    const payload = creatorProfileUpdateSchema.parse(req.body || {});
    const accountId = req.user.sub;

    const accountResult = await query(
      "SELECT id, full_name, email, phone, password, password_hash FROM creator_accounts WHERE id = $1 LIMIT 1",
      [accountId]
    );
    if (!accountResult.rowCount) return next(httpError(404, "User not found"));
    const account = accountResult.rows[0];

    const updates = [];
    const values = [];
    let i = 1;

    if (payload.full_name !== undefined) {
      updates.push(`full_name = $${i++}`);
      values.push(payload.full_name.trim());
    }

    let nextEmail = account.email;
    if (payload.email !== undefined) {
      nextEmail = String(payload.email || "").trim().toLowerCase();
      const exists = await query(
        "SELECT id FROM creator_accounts WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1",
        [nextEmail, accountId]
      );
      if (exists.rowCount) return next(httpError(409, "Email already used"));
      updates.push(`email = $${i++}`);
      values.push(nextEmail);
    }

    let nextPhone = account.phone;
    if (payload.phone !== undefined) {
      nextPhone = String(payload.phone || "").trim();
      const exists = await query(
        "SELECT id FROM creator_accounts WHERE phone = $1 AND id <> $2 LIMIT 1",
        [nextPhone, accountId]
      );
      if (exists.rowCount) return next(httpError(409, "Phone already used"));
      updates.push(`phone = $${i++}`);
      values.push(nextPhone);
    }

    if (payload.new_password !== undefined) {
      if (!payload.current_password) return next(httpError(400, "Current password is required"));
      const isValid = account.password_hash
        ? await comparePassword(payload.current_password, account.password_hash)
        : payload.current_password === account.password;
      if (!isValid) return next(httpError(401, "Current password is invalid"));

      const newHashed = await hashPassword(payload.new_password);
      updates.push(`password_hash = $${i++}`);
      values.push(newHashed);
      updates.push(`password = $${i++}`);
      values.push(payload.new_password);
    }

    if (!updates.length) return next(httpError(400, "No valid fields to update"));

    values.push(accountId);
    const updatedResult = await query(
      `UPDATE creator_accounts SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, full_name, email, phone, created_date`,
      values
    );

    const updated = updatedResult.rows[0];
    const token = signToken({ sub: updated.id, role: "creator", email: updated.email || null, phone: updated.phone || null });
    return res.json({ user: updated, token });
  } catch (err) {
    next(err);
  }
});

router.get("/creator-accounts", requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, full_name, email, phone, created_date FROM creator_accounts ORDER BY created_date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
