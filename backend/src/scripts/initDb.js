import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  // Use process.cwd() to get the root of the app (/app in Docker)
  const schemaPath = path.resolve(process.cwd(), "database/schema.sql");
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
