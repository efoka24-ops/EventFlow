const STORAGE_KEYS = {
  events: "eventflow_events",
  registrations: "eventflow_registrations",
  currentUser: "eventflow_current_user",
};

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const REMOTE_EVENTS_URL = env.VITE_EVENTFLOW_EVENTS_BLOB_URL || "https://jsonblob.com/api/jsonBlob/019d9725-a658-795a-9147-e17fd51f5207";
const REMOTE_REGISTRATIONS_URL = env.VITE_EVENTFLOW_REGISTRATIONS_BLOB_URL || "https://jsonblob.com/api/jsonBlob/019d9725-aa52-7c74-9281-2ce60fe6471f";
const REMOTE_DISABLED = String(env.VITE_EVENTFLOW_REMOTE_DISABLED || "false") === "true";
const REMOTE_ENABLED = !REMOTE_DISABLED && Boolean(REMOTE_EVENTS_URL && REMOTE_REGISTRATIONS_URL);

const nowIso = () => new Date().toISOString();

const makeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultEvents = [
  {
    id: "evt-1",
    title: "Forum Jeunesse & Innovation",
    description: "Rencontre entre jeunes porteurs de projets et experts du secteur.",
    category: "conference",
    date_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    date_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location_name: "Palais de la Culture",
    city: "Abidjan",
    address: "Treichville",
    max_participants: 300,
    price: 0,
    status: "publie",
    tags: "jeunesse,innovation,forum",
    image_url: "",
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "evt-2",
    title: "Atelier Leadership Local",
    description: "Atelier pratique pour renforcer les capacites de leadership local.",
    category: "atelier",
    date_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    date_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    location_name: "Maison des Associations",
    city: "Yamoussoukro",
    address: "Centre-ville",
    max_participants: 80,
    price: 5000,
    status: "publie",
    tags: "leadership,formation",
    image_url: "",
    created_date: nowIso(),
    updated_date: nowIso(),
  },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const readStorage = (key, fallback) => {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op in restricted environments
  }
};

const sortItems = (items, sortField) => {
  if (!sortField) return [...items];
  const desc = sortField.startsWith("-");
  const field = desc ? sortField.slice(1) : sortField;
  return [...items].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    return av > bv ? (desc ? -1 : 1) : (desc ? 1 : -1);
  });
};

const filterItems = (items, query = {}) =>
  items.filter((item) => Object.entries(query).every(([key, value]) => item?.[key] === value));

const fetchJson = async (url, options = {}) => {
  const timeoutMs = 8000;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      signal: controller?.signal,
    });
    if (!response.ok) throw new Error(`Remote storage error ${response.status}`);
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const parseArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
};

const readRemoteCollection = async (url) => {
  const payload = await fetchJson(url, { method: "GET", cache: "no-store" });
  return parseArrayPayload(payload);
};

const writeRemoteCollection = async (url, items) => {
  await fetchJson(url, { method: "PUT", body: JSON.stringify(items) });
  return items;
};

const ensureEvents = async () => {
  const local = readStorage(STORAGE_KEYS.events, defaultEvents);
  if (!REMOTE_ENABLED) {
    if (!Array.isArray(local) || local.length === 0) writeStorage(STORAGE_KEYS.events, defaultEvents);
    return Array.isArray(local) && local.length ? local : defaultEvents;
  }

  try {
    const remote = await readRemoteCollection(REMOTE_EVENTS_URL);
    if (Array.isArray(remote) && remote.length > 0) {
      writeStorage(STORAGE_KEYS.events, remote);
      return remote;
    }
    const seed = Array.isArray(local) && local.length > 0 ? local : defaultEvents;
    await writeRemoteCollection(REMOTE_EVENTS_URL, seed);
    writeStorage(STORAGE_KEYS.events, seed);
    return seed;
  } catch {
    return Array.isArray(local) && local.length ? local : defaultEvents;
  }
};

const ensureRegistrations = async () => {
  const local = readStorage(STORAGE_KEYS.registrations, []);
  if (!REMOTE_ENABLED) {
    if (!Array.isArray(local)) writeStorage(STORAGE_KEYS.registrations, []);
    return Array.isArray(local) ? local : [];
  }

  try {
    const remote = await readRemoteCollection(REMOTE_REGISTRATIONS_URL);
    if (Array.isArray(remote)) {
      writeStorage(STORAGE_KEYS.registrations, remote);
      return remote;
    }
    const seed = Array.isArray(local) ? local : [];
    await writeRemoteCollection(REMOTE_REGISTRATIONS_URL, seed);
    writeStorage(STORAGE_KEYS.registrations, seed);
    return seed;
  } catch {
    return Array.isArray(local) ? local : [];
  }
};

const saveEvents = async (events) => {
  writeStorage(STORAGE_KEYS.events, events);
  if (REMOTE_ENABLED) {
    try {
      await writeRemoteCollection(REMOTE_EVENTS_URL, events);
    } catch {
      // keep local write as fallback
    }
  }
};

const saveRegistrations = async (registrations) => {
  writeStorage(STORAGE_KEYS.registrations, registrations);
  if (REMOTE_ENABLED) {
    try {
      await writeRemoteCollection(REMOTE_REGISTRATIONS_URL, registrations);
    } catch {
      // keep local write as fallback
    }
  }
};

const eventEntity = {
  async list(sort) {
    return sortItems(await ensureEvents(), sort);
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureEvents(), query);
    result = sortItems(result, sort);
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = { ...data, id: makeId(), status: data.status || "brouillon", created_date: nowIso(), updated_date: nowIso() };
    const events = await ensureEvents();
    const updatedEvents = [next, ...events];
    await saveEvents(updatedEvents);
    return next;
  },
  async update(id, patch) {
    const events = await ensureEvents();
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) throw new Error("Event not found");
    const updated = { ...events[index], ...patch, updated_date: nowIso() };
    const nextEvents = [...events];
    nextEvents[index] = updated;
    await saveEvents(nextEvents);
    return updated;
  },
  async delete(id) {
    const [events, regs] = await Promise.all([ensureEvents(), ensureRegistrations()]);
    await saveEvents(events.filter((event) => event.id !== id));
    await saveRegistrations(regs.filter((registration) => registration.event_id !== id));
    return { success: true };
  },
};

const registrationEntity = {
  async list(sort) {
    return sortItems(await ensureRegistrations(), sort || "-created_date");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureRegistrations(), query);
    result = sortItems(result, sort || "-created_date");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = { ...data, id: makeId(), status: data.status || "en_attente", created_date: nowIso(), updated_date: nowIso() };
    const regs = await ensureRegistrations();
    const updatedRegs = [next, ...regs];
    await saveRegistrations(updatedRegs);
    return next;
  },
  async update(id, patch) {
    const regs = await ensureRegistrations();
    const index = regs.findIndex((registration) => registration.id === id);
    if (index === -1) throw new Error("Registration not found");
    const updated = { ...regs[index], ...patch, updated_date: nowIso() };
    const nextRegs = [...regs];
    nextRegs[index] = updated;
    await saveRegistrations(nextRegs);
    return updated;
  },
  async delete(id) {
    const regs = await ensureRegistrations();
    await saveRegistrations(regs.filter((registration) => registration.id !== id));
    return { success: true };
  },
};

const auth = {
  async me() {
    const user = readStorage(STORAGE_KEYS.currentUser, null);
    if (!user) throw new Error("Not authenticated");
    return user;
  },
  logout(redirectTo) {
    if (canUseStorage()) {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.currentUser);
        window.localStorage.removeItem("base44_access_token");
        window.localStorage.removeItem("base44_token");
      } catch {
        // no-op
      }
    }
    if (redirectTo && typeof window !== "undefined") window.location.assign(redirectTo);
  },
  redirectToLogin(redirectTo) {
    if (redirectTo && typeof window !== "undefined") window.location.assign(redirectTo);
  },
};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      return { file_url: URL.createObjectURL(file) };
    },
    async SendEmail() {
      return { ok: true };
    },
  },
};

export const base44 = {
  auth,
  entities: {
    Event: eventEntity,
    Registration: registrationEntity,
  },
  integrations,
};

export const base44Public = base44;
export const canUseBase44 = false;