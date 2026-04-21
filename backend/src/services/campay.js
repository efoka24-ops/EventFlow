import { config } from "../config.js";
import { httpError } from "../utils/httpError.js";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const campayFetch = async (path, options = {}) => {
  const response = await fetch(`${config.campayBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.error(`[CamPay] ${options.method || "GET"} ${path} → HTTP ${response.status}`, JSON.stringify(data));
    const message = data?.message || data?.error || `CamPay error (${response.status})`;
    const normalizedMessage = String(message || "").toLowerCase();
    if (
      normalizedMessage.includes("maximum amount is") ||
      normalizedMessage.includes("demo system") ||
      normalizedMessage.includes("25.00 xaf")
    ) {
      throw httpError(400, message);
    }
    throw httpError(502, message);
  }
  console.log(`[CamPay] ${options.method || "GET"} ${path} → OK`, JSON.stringify(data));

  return data;
};

const getTemporaryToken = async () => {
  if (!config.campayUsername || !config.campayPassword) {
    throw httpError(500, "CamPay credentials are not configured");
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 15000) {
    return cachedToken;
  }

  console.log("[CamPay] Requesting token with username:", config.campayUsername?.substring(0, 20) + "...");
  // CamPay live uses client_id/client_secret; demo uses username/password
  const isLive = !String(config.campayBaseUrl || "").includes("demo");
  const body = isLive
    ? { client_id: config.campayUsername, client_secret: config.campayPassword }
    : { username: config.campayUsername, password: config.campayPassword };
  const data = await campayFetch("/token/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log("[CamPay] Token response:", JSON.stringify(data));

  cachedToken = data.token;
  cachedTokenExpiresAt = now + Number(data.expires_in || 0) * 1000;
  return cachedToken;
};

const getAuthHeader = async () => {
  if (config.campayPermanentToken) {
    // Try both Token and Bearer — live CamPay uses Token
    return `Token ${config.campayPermanentToken}`;
  }

  const token = await getTemporaryToken();
  return `Token ${token}`;
};

export const campayRequestPayment = async (payload) => {
  const authHeader = await getAuthHeader();
  return campayFetch("/collect/", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: JSON.stringify(payload),
  });
};

export const campayCreatePaymentLink = async (payload) => {
  const authHeader = await getAuthHeader();
  return campayFetch("/get_payment_link/", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: JSON.stringify(payload),
  });
};

export const campayGetTransactionStatus = async (reference) => {
  const authHeader = await getAuthHeader();
  return campayFetch(`/transaction/${reference}/`, {
    method: "GET",
    headers: { Authorization: authHeader },
  });
};

export const mapCampayStatusToLocal = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "SUCCESSFUL") return "successful";
  if (normalized === "FAILED") return "failed";
  return "pending";
};
