import { apiGet, apiPost, apiPatch, tokenStore, decodeJwtPayload } from "./apiClient";

export const adminLogin = async ({ email, password }) => {
  const data = await apiPost("/auth/admin/login", { email, password }, { token: null });
  tokenStore.setAdminToken(data.token);
  return data;
};

export const adminLogout = async () => {
  try {
    await apiPost("/auth/logout", {}, { token: tokenStore.getAdminToken() });
  } catch {}
  tokenStore.clearAdminToken();
};

export const creatorLogin = async ({ identifier, password }) => {
  const data = await apiPost("/auth/creator/login", { identifier, password }, { token: null });
  tokenStore.setCreatorToken(data.token);
  window.dispatchEvent(new Event("creator-session-changed"));
  return data;
};

export const creatorSignup = async (payload) => {
  const data = await apiPost("/auth/creator/signup", payload, { token: null });
  tokenStore.setCreatorToken(data.token);
  window.dispatchEvent(new Event("creator-session-changed"));
  return data;
};

export const creatorLogout = async () => {
  try {
    await apiPost("/auth/logout", {}, { token: tokenStore.getCreatorToken() });
  } catch {}
  tokenStore.clearCreatorToken();
  window.dispatchEvent(new Event("creator-session-changed"));
};

export const getAdminUser = () => {
  const token = tokenStore.getAdminToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) { tokenStore.clearAdminToken(); return null; }
  // Allow expired tokens here — the interceptor will refresh on next API call
  const ADMIN_ROLES = ["super_admin", "admin", "support", "finance", "marketing", "moderator"];
  const role = ADMIN_ROLES.includes(payload.role) ? payload.role : "admin";
  return { ...payload, role, isAdmin: true };
};

export const getCreatorUser = () => {
  const token = tokenStore.getCreatorToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  // Don't reject expired tokens — the refresh interceptor will renew on next API call
  if (!payload) { tokenStore.clearCreatorToken(); return null; }
  return { ...payload, role: "creator" };
};

export const fetchMe = () => apiGet("/auth/me");

export const updateCreatorProfile = async (payload) => {
  const data = await apiPatch("/auth/creator/me", payload);
  if (data?.token) {
    tokenStore.setCreatorToken(data.token);
    window.dispatchEvent(new Event("creator-session-changed"));
  }
  return data;
};

export const fetchCreatorAccounts = () => apiGet("/auth/creator-accounts");
