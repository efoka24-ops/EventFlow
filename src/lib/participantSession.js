const KEY = "eventflow_participant_email";
const FAVORITES_KEY = "eventflow_participant_favorite_events";

const emitParticipantSessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("participant-session-changed"));
  }
};

const normalizeFavoriteEvent = (event) => {
  if (!event?.id) return null;
  return {
    id: event.id,
    title: event.title || "Événement",
    date_start: event.date_start || null,
    city: event.city || null,
    location_name: event.location_name || null,
    image_url: event.image_url || null,
    price: event.price ?? 0,
    category: event.category || null,
  };
};

export const normalizeParticipantEmail = (v) => String(v || "").trim().toLowerCase();

export const getParticipantEmail = () => {
  try { return normalizeParticipantEmail(window.localStorage.getItem(KEY) || ""); } catch { return ""; }
};

export const setParticipantEmail = (email) => {
  const v = normalizeParticipantEmail(email);
  if (!v) return;
  try {
    window.localStorage.setItem(KEY, v);
    emitParticipantSessionChange();
  } catch {}
};

export const clearParticipantEmail = () => {
  try {
    window.localStorage.removeItem(KEY);
    emitParticipantSessionChange();
  } catch {}
};

export const getFavoriteEvents = () => {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const isFavoriteEvent = (eventId) => getFavoriteEvents().some((event) => event.id === eventId);

export const addFavoriteEvent = (event) => {
  const nextEvent = normalizeFavoriteEvent(event);
  if (!nextEvent) return;
  const current = getFavoriteEvents().filter((item) => item.id !== nextEvent.id);
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([nextEvent, ...current]));
    emitParticipantSessionChange();
  } catch {}
};

export const removeFavoriteEvent = (eventId) => {
  try {
    const next = getFavoriteEvents().filter((event) => event.id !== eventId);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    emitParticipantSessionChange();
  } catch {}
};
