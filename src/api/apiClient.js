const ADMIN_TOKEN_KEY = "eventflow_admin_token";
const CREATOR_TOKEN_KEY = "eventflow_creator_token";

const ls = {
  get: (key) => { try { return window.localStorage.getItem(key); } catch { return null; } },
  set: (key, v) => { try { window.localStorage.setItem(key, v); } catch {} },
  del: (key) => { try { window.localStorage.removeItem(key); } catch {} },
};

export const tokenStore = {
  getAdminToken: () => ls.get(ADMIN_TOKEN_KEY),
  setAdminToken: (t) => ls.set(ADMIN_TOKEN_KEY, t),
  clearAdminToken: () => ls.del(ADMIN_TOKEN_KEY),
  getCreatorToken: () => ls.get(CREATOR_TOKEN_KEY),
  setCreatorToken: (t) => ls.set(CREATOR_TOKEN_KEY, t),
  clearCreatorToken: () => ls.del(CREATOR_TOKEN_KEY),
  getActiveToken: () => ls.get(ADMIN_TOKEN_KEY) || ls.get(CREATOR_TOKEN_KEY),
  clearAll: () => { ls.del(ADMIN_TOKEN_KEY); ls.del(CREATOR_TOKEN_KEY); },
};

// Decode JWT payload without verifying signature (verification happens on the backend).
export const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export class ApiError extends Error {
  constructor(status, message, body = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const apiRequest = async (path, options = {}) => {
  const { token: overrideToken, headers: extraHeaders, body, ...rest } = options;
  const url = path.startsWith("http") ? path : `/api${path}`;

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = overrideToken !== undefined ? overrideToken : tokenStore.getActiveToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  Object.assign(headers, extraHeaders || {});

  const response = await fetch(url, { ...rest, headers, body });

  if (!response.ok) {
    let errorBody = {};
    try { errorBody = await response.json(); } catch {}
    throw new ApiError(response.status, errorBody?.error || response.statusText, errorBody);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const apiGet = (path, opts) =>
  apiRequest(path, { method: "GET", ...opts });

export const apiPost = (path, data, opts) =>
  apiRequest(path, { method: "POST", body: JSON.stringify(data), ...opts });

export const apiPatch = (path, data, opts) =>
  apiRequest(path, { method: "PATCH", body: JSON.stringify(data), ...opts });

export const apiDelete = (path, opts) =>
  apiRequest(path, { method: "DELETE", ...opts });
