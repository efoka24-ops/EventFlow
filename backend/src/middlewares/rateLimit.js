const buckets = new Map();

const cleanupExpiredEntries = (now) => {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
};

export const createRateLimiter = ({ windowMs = 60_000, max = 120, name = "global" } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const ip = String(req.ip || req.connection?.remoteAddress || "unknown");
    const key = `${name}:${ip}`;

    if (Math.random() < 0.02) cleanupExpiredEntries(now);

    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests. Please retry later." });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};
