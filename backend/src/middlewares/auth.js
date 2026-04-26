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

const ADMIN_ROLES = new Set(["super_admin", "admin", "support", "finance", "marketing", "moderator"]);

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (!ADMIN_ROLES.has(req.user?.role)) return next(httpError(403, "Admin access required"));
    return next();
  });
};

export const requireSuperAdmin = (req, res, next) => {
  requireAdmin(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role !== "super_admin") return next(httpError(403, "Super admin access required"));
    return next();
  });
};

// requireRole("admin", "finance") — accepts super_admin implicitly
export const requireRole = (...roles) => (req, res, next) => {
  requireAdmin(req, res, (err) => {
    if (err) return next(err);
    if (req.user?.role === "super_admin") return next();
    if (roles.includes(req.user?.role)) return next();
    return next(httpError(403, "Insufficient role for this action"));
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
