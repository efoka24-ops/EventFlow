import { verifyToken } from "../utils/auth.js";
import { httpError } from "../utils/httpError.js";

const readBearerToken = (req) => {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
};

export const requireAuth = (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) return next(httpError(401, "Missing auth token"));

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(httpError(401, "Invalid auth token"));
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== "admin") return next(httpError(403, "Admin access required"));
    return next();
  });
};

export const optionalAuth = (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();

  try {
    req.user = verifyToken(token);
  } catch {
    req.user = null;
  }
  return next();
};
