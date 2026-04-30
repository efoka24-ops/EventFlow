import dotenv from "dotenv";

dotenv.config();

const REQUIRED_IN_PRODUCTION = [
  "JWT_SECRET",
  "DATABASE_URL",
  "CORS_ORIGIN",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[config] FATAL: Variables d'environnement manquantes en production : ${missing.join(", ")}`);
    process.exit(1);
  }
} else {
  if (!process.env.JWT_SECRET) {
    console.warn("[config] JWT_SECRET non défini — fallback non sécurisé actif (développement uniquement)");
  }
  if (!process.env.DATABASE_URL) {
    console.warn("[config] DATABASE_URL non défini — les fonctionnalités DB seront indisponibles");
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: process.env.DB_SSL === "true" ? true : process.env.DB_SSL === "false" ? false : undefined,
  dbSslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  jwtSecret: process.env.JWT_SECRET || "dev_fallback_secret_change_in_production",
  // Access token: short-lived (1h). Refresh token handles long sessions.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  refreshTokenExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  // CamPay
  campayBaseUrl: process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api",
  campayUsername: process.env.CAMPAY_USERNAME || "",
  campayPassword: process.env.CAMPAY_PASSWORD || "",
  campayPermanentToken: process.env.CAMPAY_PERMANENT_TOKEN || "",
  // Easy Transact
  etBaseUrl: process.env.ET_BASE_URL || "https://api.easy-transact.net",
  etClientId: process.env.ET_CLIENT_ID || "",
  etClientSecret: process.env.ET_CLIENT_SECRET || "",
  etDemoMode: process.env.ET_DEMO_MODE === "true",
  // Secret partagé pour vérifier les signatures des webhooks Easy Transact
  etWebhookSecret: process.env.ET_WEBHOOK_SECRET || "",
};
