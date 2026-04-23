import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
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
