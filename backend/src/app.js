import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";
import { createRateLimiter } from "./middlewares/rateLimit.js";

export const app = express();

app.disable("x-powered-by");

const globalLimiter = createRateLimiter({ windowMs: 60_000, max: 300, name: "global" });
const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 40, name: "auth" });
const paymentLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 80, name: "payments" });
const ticketsLimiter = createRateLimiter({ windowMs: 60_000, max: 20, name: "tickets" });
const contactLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10, name: "contact" });

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(globalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/payments", paymentLimiter);
app.use("/api/registrations/my-tickets", ticketsLimiter);
app.use("/api/contact", contactLimiter);
app.use(express.json({
  limit: "2mb",
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "eventflow-backend" });
});

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  const isZod = err instanceof ZodError;
  const status = err.status || (isZod ? 400 : 500);
  const message = err.message || "Internal server error";
  if (status >= 500) {
    console.error(err);
  }

  if (isZod) {
    return res.status(status).json({ error: err.errors?.map((e) => e.message).join(", ") || "Invalid request payload" });
  }

  return res.status(status).json({ error: message });
});
