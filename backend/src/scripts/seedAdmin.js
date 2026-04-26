import { query, pool } from "../db.js";
import { hashPassword } from "../utils/auth.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const emailRaw = process.env.ADMIN_EMAIL || "";
  const passwordRaw = process.env.ADMIN_PASSWORD || "";
  const fullName = (process.env.ADMIN_FULL_NAME || "Administrator").trim() || "Administrator";

  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw.trim();

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed admin account");
  }

  const passwordHash = await hashPassword(password);

  const sql = `
    INSERT INTO admin_accounts (full_name, email, password_hash, is_active, role)
    VALUES ($1, $2, $3, true, 'super_admin')
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash,
      is_active = true,
      role = CASE
        WHEN admin_accounts.role = 'admin' THEN 'super_admin'
        ELSE admin_accounts.role
      END,
      updated_date = NOW()
    RETURNING id, full_name, email, role, is_active, created_date, updated_date
  `;

  const delays = [0, 2000, 5000]; // 3 attempts: immediate, +2s, +5s
  let lastError;

  for (const delay of delays) {
    if (delay > 0) {
      console.log(`[db:seed-admin] Retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
    try {
      const { rows } = await query(sql, [fullName, email, passwordHash]);
      console.log("[db:seed-admin] Admin account upserted:", rows[0]);
      return;
    } catch (err) {
      lastError = err;
      console.warn("[db:seed-admin] Attempt failed:", err.message);
    }
  }

  throw lastError;
};

run()
  .catch((error) => {
    console.error("[db:seed-admin] Failed:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
