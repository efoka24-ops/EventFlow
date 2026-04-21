import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { httpError } from "../utils/httpError.js";

export const detectNetwork = (phone) => {
  // Cameroon: Orange=69X, MTN=65X/67X/68X
  const digits = String(phone).replace(/\D/g, "");
  const local = digits.startsWith("237") ? digits.slice(3) : digits;
  if (local.startsWith("69")) return "ORANGE";
  return "MTN";
};

// In-memory store for demo mode
const demoStore = new Map();

const etFetch = async (path, options = {}) => {
  const url = `${config.etBaseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.etClientId,
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
    console.error(`[EasyTransact] ${options.method || "GET"} ${path} → HTTP ${response.status}`, JSON.stringify(data));
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      (data?.non_field_errors?.[0]) ||
      `EasyTransact error (${response.status})`;
    throw httpError(response.status >= 500 ? 502 : response.status, message);
  }

  console.log(`[EasyTransact] ${options.method || "GET"} ${path} → OK`, JSON.stringify(data));
  return data;
};

/**
 * Create a hosted checkout link (works with CASH_IN service).
 * Returns { status, checkout_url, payment_link_id, vendor_reference }
 */
export const etCreateCheckoutLink = async ({ amount, description, vendor_reference, currency_code = "XAF", success_url, cancel_url }) => {
  if (config.etDemoMode) {
    const link_id = `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`;
    const entry = { status: "SUCCESS", checkout_url: `https://bo.easy-transact.net/pay/${link_id}`, payment_link_id: link_id, vendor_reference, created_at: new Date().toISOString() };
    demoStore.set(vendor_reference, { ...entry, tx_status: "INITIATED" });
    demoStore.set(link_id, entry);
    console.log(`[EasyTransact][DEMO] Checkout link: ${link_id}`);
    return entry;
  }
  return etFetch("/api/v1/partner/transactions/checkout-link/", {
    method: "POST",
    body: JSON.stringify({
      amount: String(amount),
      currency_code,
      service_code: "CASH_IN",
      description,
      vendor_reference,
      success_url: success_url || config.etSuccessUrl || "",
      cancel_url: cancel_url || config.etCancelUrl || "",
    }),
  });
};

/**
 * Get transaction status by vendor_reference.
 * Returns { status, vendor_reference, ... }
 */
export const etGetTransactionStatus = async (vendor_reference) => {
  if (config.etDemoMode) {
    const tx = demoStore.get(vendor_reference);
    if (!tx) return { status: "NOT_FOUND", vendor_reference };
    const ageMs = Date.now() - new Date(tx.created_at).getTime();
    const status = ageMs > 10000 ? "SUCCESS" : "INITIATED";
    console.log(`[EasyTransact][DEMO] Status ${vendor_reference}: ${status}`);
    return { ...tx, status };
  }
  return etFetch(`/api/v1/partner/transactions/status/?vendor_reference=${encodeURIComponent(vendor_reference)}`);
};

export const mapEtStatusToLocal = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "SUCCESS") return "successful";
  if (s === "FAILED" || s === "TIMEOUT" || s === "REVERSED" || s === "REFUNDED" || s === "EXPIRED") return "failed";
  if (s === "INITIATED") return "initiated";
  return "pending";
};
