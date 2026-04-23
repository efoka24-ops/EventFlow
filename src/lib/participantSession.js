const KEY = "eventflow_participant_email";

export const normalizeParticipantEmail = (v) => String(v || "").trim().toLowerCase();

export const getParticipantEmail = () => {
  try { return normalizeParticipantEmail(window.localStorage.getItem(KEY) || ""); } catch { return ""; }
};

export const setParticipantEmail = (email) => {
  const v = normalizeParticipantEmail(email);
  if (!v) return;
  try { window.localStorage.setItem(KEY, v); } catch {}
};

export const clearParticipantEmail = () => {
  try { window.localStorage.removeItem(KEY); } catch {}
};
