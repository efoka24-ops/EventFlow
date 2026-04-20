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
    const message = data?.message || data?.error || `CamPay error (${response.status})`;
    const normalizedMessage = String(message || "").toLowerCase();
    // CamPay demo environment has strict amount limits; expose as a functional 400
    if (
      normalizedMessage.includes("maximum amount is") ||
      normalizedMessage.includes("demo system") ||
      normalizedMessage.includes("25.00 xaf")
    ) {
      throw httpError(400, message);
    }
    // Orange Money not supported by this CamPay account / demo
    if (
      normalizedMessage.includes("operator not supported") ||
      normalizedMessage.includes("not supported") ||
      normalizedMessage.includes("orange") ||
      normalizedMessage.includes("invalid phone") ||
      normalizedMessage.includes("unsupported operator") ||
      normalizedMessage.includes("could not determine operator")
    ) {
      throw httpError(400, "Opérateur non supporté : seul MTN MoMo est disponible pour ce compte CamPay. Utilisez un numéro MTN (67X / 65X).");
    }
    throw httpError(502, message);
  }

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

  const data = await campayFetch("/token/", {
    method: "POST",
    body: JSON.stringify({
      username: config.campayUsername,
      password: config.campayPassword,
    }),
  });

  cachedToken = data.token;
  cachedTokenExpiresAt = now + Number(data.expires_in || 0) * 1000;
  return cachedToken;
};

const getAuthHeader = async () => {
  if (config.campayPermanentToken) {
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
