import { tokenStore, decodeJwtPayload } from "@/api/apiClient";

export const normalizeEmail = (v) => String(v || "").trim().toLowerCase();
export const normalizePhone = (v) => String(v || "").replace(/[^\d+]/g, "").trim();
export const normalizeIdentifier = (v) => {
  const raw = String(v || "").trim();
  return raw.includes("@") ? normalizeEmail(raw) : normalizePhone(raw);
};

const getPayload = () => {
  const token = tokenStore.getCreatorToken();
  if (!token) return null;
  const p = decodeJwtPayload(token);
  // Don't reject expired tokens here — the API interceptor (apiClient.js) handles
  // silent refresh via the HttpOnly refresh cookie. Clearing the token here would
  // prevent the interceptor from knowing there's a session to refresh.
  if (!p) return null;
  return p;
};

export const getCreatorUser = () => getPayload();
export const getCreatorEmail = () => normalizeEmail(getPayload()?.email || "");
export const getCreatorPhone = () => normalizePhone(getPayload()?.phone || "");
export const getCreatorAccountId = () => getPayload()?.sub || "";
export const clearCreatorSession = () => {
  tokenStore.clearCreatorToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-session-changed"));
  }
};

// Legacy aliases kept for backward compat during migration
export const setCreatorAccountId = () => {};
export const setCreatorIdentity = () => {};
export const clearCreatorAccountId = clearCreatorSession;
export const clearCreatorIdentity = () => {};
