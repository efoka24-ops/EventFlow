const PARTICIPANT_EMAIL_KEY = "eventflow_participant_email";

export const normalizeParticipantEmail = (email) =>
  String(email || "").trim().toLowerCase();

export const getParticipantEmail = () => {
  if (typeof window === "undefined") return "";
  return normalizeParticipantEmail(window.localStorage.getItem(PARTICIPANT_EMAIL_KEY) || "");
};

export const setParticipantEmail = (email) => {
  if (typeof window === "undefined") return;
  const normalized = normalizeParticipantEmail(email);
  if (!normalized) return;
  window.localStorage.setItem(PARTICIPANT_EMAIL_KEY, normalized);
};

export const clearParticipantEmail = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PARTICIPANT_EMAIL_KEY);
};
