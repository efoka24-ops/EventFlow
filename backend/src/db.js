import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

const connectionString =
  !config.dbSslRejectUnauthorized && config.databaseUrl
    ? config.databaseUrl.replace(/([?&]sslmode=)require\b/i, "$1no-verify")
    : config.databaseUrl;

const shouldUseSsl =
  config.dbSsl ??
  /[?&]sslmode=(require|verify-ca|verify-full|prefer|no-verify)\b/i.test(connectionString || "");

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 12,
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: config.dbSslRejectUnauthorized,
        },
      }
    : {}),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isTransientDbError = (error) => {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toUpperCase();

  return (
    ["EAI_AGAIN", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "57P01"].includes(code) ||
    message.includes("EAI_AGAIN") ||
    message.includes("CONNECTION TERMINATED") ||
    message.includes("CONNECT ETIMEDOUT")
  );
};

export const query = async (text, params = []) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      if (!isTransientDbError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(200 * attempt);
    }
  }

  throw new Error("Unexpected query retry state");
};
