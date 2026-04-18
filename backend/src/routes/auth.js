import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { config } from "../config.js";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { httpError } from "../utils/httpError.js";

const router = Router();

const creatorSignupSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(4),
});

const creatorLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/creator/signup", async (req, res, next) => {
  try {
    const payload = creatorSignupSchema.parse(req.body);
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();

    if (!email && !phone) return next(httpError(400, "Email or phone is required"));

    const exists = await query(
      `SELECT id FROM creator_accounts WHERE (LOWER(email) = LOWER($1) AND $1 <> '') OR (phone = $2 AND $2 <> '') LIMIT 1`,
      [email, phone]
    );

    if (exists.rowCount) return next(httpError(409, "Creator account already exists"));

    const hashed = await hashPassword(payload.password);
    const created = await query(
      `INSERT INTO creator_accounts (full_name, email, phone, password_hash, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, created_date`,
      [payload.full_name.trim(), email || null, phone || null, hashed, payload.password]
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
    if (!config.adminEmail || !config.adminPassword) {
      return next(httpError(500, "Admin credentials are not configured"));
    }

    const emailOk = payload.email.trim().toLowerCase() === config.adminEmail.trim().toLowerCase();
    const pwdOk = payload.password === config.adminPassword;

    if (!emailOk || !pwdOk) return next(httpError(401, "Invalid admin credentials"));

    const token = signToken({ sub: "admin", role: "admin", email: config.adminEmail });
    res.json({ token, user: { id: "admin", role: "admin", email: config.adminEmail } });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return res.json({ id: "admin", role: "admin", email: req.user.email || config.adminEmail });
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
