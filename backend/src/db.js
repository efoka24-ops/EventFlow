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
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: config.dbSslRejectUnauthorized,
        },
      }
    : {}),
});

export const query = (text, params = []) => pool.query(text, params);
