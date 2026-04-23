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

  if (hasAdminSeedInputs) {
    console.log("[db:bootstrap] Seeding admin account...");
    run("node src/scripts/seedAdmin.js");
  } else {
    console.log("[db:bootstrap] ADMIN_EMAIL/ADMIN_PASSWORD not set; skipping admin seed");
  }

  console.log("[db:bootstrap] Done");
} catch (error) {
  console.error("[db:bootstrap] Failed:", error?.message || error);
  process.exit(1);
}