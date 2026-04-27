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

export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  // Refresh 30s before actual expiry to avoid races
  return payload.exp * 1000 - 30_000 < Date.now();
};

export class ApiError extends Error {
  constructor(status, message, body = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ─── Refresh token machinery ──────────────────────────────────────────────────

let _isRefreshing = false;
let _refreshQueue = []; // { resolve, reject }[]

const drainQueue = (error, newToken) => {
  _refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(newToken)));
  _refreshQueue = [];
};

const doRefresh = async () => {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include", // send HttpOnly refresh cookie
  });

  if (!res.ok) {
    throw new ApiError(res.status, "Session expirée — veuillez vous reconnecter");
  }

  const { token, user_type } = await res.json();

  if (user_type === "admin") tokenStore.setAdminToken(token);
  else tokenStore.setCreatorToken(token);

  return token;
};

const refreshOnce = () => {
  if (_isRefreshing) {
    return new Promise((resolve, reject) => {
      _refreshQueue.push({ resolve, reject });
    });
  }

  _isRefreshing = true;
  return doRefresh()
    .then((token) => { drainQueue(null, token); return token; })
    .catch((err) => { drainQueue(err); throw err; })
    .finally(() => { _isRefreshing = false; });
};

// ─── Core request ─────────────────────────────────────────────────────────────

const executeRequest = async (path, options = {}) => {
  const { token: overrideToken, headers: extraHeaders, body, ...rest } = options;
  const url = path.startsWith("http") ? path : `/api${path}`;

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = overrideToken !== undefined ? overrideToken : tokenStore.getActiveToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  Object.assign(headers, extraHeaders || {});

  const response = await fetch(url, { ...rest, headers, body, credentials: "include" });

  if (!response.ok) {
    let errorBody = {};
    try { errorBody = await response.json(); } catch {}
    throw new ApiError(response.status, errorBody?.error || response.statusText, errorBody);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const apiRequest = async (path, options = {}) => {
  // Skip refresh for auth endpoints to avoid infinite loops
  const isAuthRoute = path.startsWith("/auth/") || path === "/auth/refresh" || path === "/auth/logout";
  const overrideTokenSet = "token" in options;

  // Proactive refresh: if current token is about to expire, refresh silently before the call
  if (!isAuthRoute && !overrideTokenSet) {
    const currentToken = tokenStore.getActiveToken();
    if (currentToken && isTokenExpired(currentToken)) {
      try {
        const newToken = await refreshOnce();
        options = { ...options, token: newToken };
      } catch {
        // Refresh failed — let the request fail naturally with 401
        tokenStore.clearAll();
        window.dispatchEvent(new CustomEvent("session-expired"));
      }
    }
  }

  try {
    return await executeRequest(path, options);
  } catch (err) {
    // Reactive refresh: 401 from server (token rejected despite not expired locally)
    if (err instanceof ApiError && err.status === 401 && !isAuthRoute && !overrideTokenSet) {
      try {
        const newToken = await refreshOnce();
        return await executeRequest(path, { ...options, token: newToken });
      } catch {
        tokenStore.clearAll();
        window.dispatchEvent(new CustomEvent("session-expired"));
        throw err;
      }
    }
    throw err;
  }
};

export const apiGet = (path, opts) =>
  apiRequest(path, { method: "GET", ...opts });

export const apiPost = (path, data, opts) =>
  apiRequest(path, { method: "POST", body: JSON.stringify(data), ...opts });

export const apiPatch = (path, data, opts) =>
  apiRequest(path, { method: "PATCH", body: JSON.stringify(data), ...opts });

export const apiDelete = (path, opts) =>
  apiRequest(path, { method: "DELETE", ...opts });
