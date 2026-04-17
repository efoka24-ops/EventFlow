const CREATOR_ACCOUNT_ID_KEY = "eventflow_creator_account_id";
const CREATOR_EMAIL_KEY = "eventflow_creator_email";
const CREATOR_PHONE_KEY = "eventflow_creator_phone";

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const normalizePhone = (phone) => String(phone || "").replace(/[^\d+]/g, "").trim();

export const normalizeIdentifier = (identifier) => {
  const raw = String(identifier || "").trim();
  return raw.includes("@") ? normalizeEmail(raw) : normalizePhone(raw);
};

export const setCreatorAccountId = (id) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CREATOR_ACCOUNT_ID_KEY, String(id || ""));
};

export const getCreatorAccountId = () => {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem(CREATOR_ACCOUNT_ID_KEY) || "");
};

export const clearCreatorAccountId = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CREATOR_ACCOUNT_ID_KEY);
};

export const setCreatorIdentity = ({ email, phone } = {}) => {
  if (typeof window === "undefined") return;
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  if (normalizedEmail) {
    window.localStorage.setItem(CREATOR_EMAIL_KEY, normalizedEmail);
  } else {
    window.localStorage.removeItem(CREATOR_EMAIL_KEY);
  }
  if (normalizedPhone) {
    window.localStorage.setItem(CREATOR_PHONE_KEY, normalizedPhone);
  } else {
    window.localStorage.removeItem(CREATOR_PHONE_KEY);
  }
};

export const getCreatorEmail = () => {
  if (typeof window === "undefined") return "";
  return normalizeEmail(window.localStorage.getItem(CREATOR_EMAIL_KEY) || "");
};

export const getCreatorPhone = () => {
  if (typeof window === "undefined") return "";
  return normalizePhone(window.localStorage.getItem(CREATOR_PHONE_KEY) || "");
};

export const clearCreatorIdentity = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CREATOR_EMAIL_KEY);
  window.localStorage.removeItem(CREATOR_PHONE_KEY);
};
