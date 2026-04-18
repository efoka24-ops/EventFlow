import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  campayBaseUrl: process.env.CAMPAY_BASE_URL || "https://demo.campay.net/api",
  campayUsername: process.env.CAMPAY_USERNAME || "",
  campayPassword: process.env.CAMPAY_PASSWORD || "",
  campayPermanentToken: process.env.CAMPAY_PERMANENT_TOKEN || "",
};
