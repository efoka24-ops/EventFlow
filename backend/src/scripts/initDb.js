import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const run = async () => {
  const candidatePaths = [
    path.resolve(process.cwd(), "database/schema.sql"),
    path.resolve(projectRoot, "database/schema.sql"),
  ];
  let schemaPath = null;

  for (const candidate of candidatePaths) {
    try {
      await readFile(candidate, "utf8");
      schemaPath = candidate;
      break;
    } catch {
      // Try next candidate.
    }
  }

  if (!schemaPath) {
    throw new Error(`Unable to locate database/schema.sql. Tried: ${candidatePaths.join(", ")}`);
  }

  console.log(`[init-db] Reading schema from: ${schemaPath}`);
  const sql = await readFile(schemaPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Database initialized with database/schema.sql");
};

run().catch(async (err) => {
  console.error("Failed to initialize database:", err);
  await pool.end();
  process.exit(1);
});
