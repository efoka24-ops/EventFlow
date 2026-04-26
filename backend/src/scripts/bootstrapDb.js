import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const run = (command) => {
  execSync(command, { stdio: "inherit" });
};

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasAdminSeedInputs = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

if (!hasDatabaseUrl) {
  console.warn("[db:bootstrap] DATABASE_URL missing; skipping migrations and admin seed");
  process.exit(0);
}

try {
  console.log("[db:bootstrap] Running migrations...");
  run("node src/scripts/migrateDb.js");
} catch (error) {
  console.error("[db:bootstrap] Failed:", error?.message || error);
  process.exit(1);
}

if (hasAdminSeedInputs) {
  // Seed is idempotent — don't block server startup if it fails (admin may already exist)
  try {
    console.log("[db:bootstrap] Seeding admin account...");
    run("node src/scripts/seedAdmin.js");
  } catch {
    console.warn("[db:bootstrap] Admin seed failed (non-fatal) — server will start anyway");
  }
} else {
  console.log("[db:bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seed");
}

console.log("[db:bootstrap] Done");