import dotenv from "dotenv";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn("[config] JWT_SECRET is not set — using insecure fallback for development only");
}
if (!process.env.DATABASE_URL) {
  console.warn("[config] DATABASE_URL is not set — DB features will be unavailable");
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev_fallback_secret_change_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  // CamPay
  campayBaseUrl: process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api",
  campayUsername: process.env.CAMPAY_USERNAME || "",
  campayPassword: process.env.CAMPAY_PASSWORD || "",
  campayPermanentToken: process.env.CAMPAY_PERMANENT_TOKEN || "",
  // Easy Transact (unused)
  etBaseUrl: process.env.ET_BASE_URL || "https://api.easy-transact.net",
  etClientId: process.env.ET_CLIENT_ID || "",
  etClientSecret: process.env.ET_CLIENT_SECRET || "",
  etDemoMode: process.env.ET_DEMO_MODE === "true",
};
