import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const MIGRATIONS_TABLE = "schema_migrations";

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id bigserial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      applied_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);
};

const getMigrationFiles = async (migrationsDir) => {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d+_.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));
};

const getAppliedMigrations = async () => {
  const { rows } = await pool.query(`SELECT filename FROM ${MIGRATIONS_TABLE}`);
  return new Set(rows.map((row) => row.filename));
};

const applyMigration = async (migrationsDir, filename) => {
  const sqlPath = path.join(migrationsDir, filename);
  const sql = await readFile(sqlPath, "utf8");

  await pool.query("BEGIN");
  try {
    await pool.query(sql);
    await pool.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
      [filename]
    );
    await pool.query("COMMIT");
    console.log(`[db:migrate] Applied ${filename}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

const run = async () => {
  const candidateDirs = [
    path.resolve(process.cwd(), "database/migrations"),
    path.resolve(projectRoot, "database/migrations"),
  ];

  const migrationsDir = candidateDirs[0];
  let resolvedMigrationsDir = null;

  for (const candidate of candidateDirs) {
    try {
      await readdir(candidate);
      resolvedMigrationsDir = candidate;
      break;
    } catch {
      // Try next candidate.
    }
  }

  if (!resolvedMigrationsDir) {
    throw new Error(`Unable to locate database migrations directory. Tried: ${candidateDirs.join(", ")}`);
  }

  console.log(`[db:migrate] Using migrations directory: ${resolvedMigrationsDir}`);

  await ensureMigrationsTable();
  const files = await getMigrationFiles(resolvedMigrationsDir);
  const applied = await getAppliedMigrations();

  let appliedCount = 0;
  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`[db:migrate] Skipped ${filename} (already applied)`);
      continue;
    }
    await applyMigration(resolvedMigrationsDir, filename);
    appliedCount += 1;
  }

  if (appliedCount === 0) {
    console.log("[db:migrate] No pending migrations");
  } else {
    console.log(`[db:migrate] Completed ${appliedCount} migration(s)`);
  }
};

run()
  .catch(async (error) => {
    console.error("[db:migrate] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
