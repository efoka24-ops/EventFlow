const STORAGE_KEYS = {
  events: 'eventflow_events',
  registrations: 'eventflow_registrations',
  currentUser: 'eventflow_current_user',
};

const nowIso = () => new Date().toISOString();

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultEvents = [
  {
    id: 'evt-1',
    title: 'Forum Jeunesse & Innovation',
    description: 'Rencontre entre jeunes porteurs de projets et experts du secteur.',
    category: 'conference',
    date_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    date_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location_name: 'Palais de la Culture',
    city: 'Abidjan',
    address: 'Treichville',
    max_participants: 300,
    price: 0,
    status: 'publie',
    tags: 'jeunesse,innovation,forum',
    image_url: '',
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: 'evt-2',
    title: 'Atelier Leadership Local',
    description: 'Atelier pratique pour renforcer les capacites de leadership local.',
    category: 'atelier',
    date_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    date_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    location_name: 'Maison des Associations',
    city: 'Yamoussoukro',
    address: 'Centre-ville',
    max_participants: 80,
    price: 5000,
    status: 'publie',
    tags: 'leadership,formation',
    image_url: '',
    created_date: nowIso(),
    updated_date: nowIso(),
  },
];

const readStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op in restricted environments
  }
};

const ensureSeeded = () => {
  const existing = readStorage(STORAGE_KEYS.events, null);
  if (!Array.isArray(existing) || existing.length === 0) {
    writeStorage(STORAGE_KEYS.events, defaultEvents);
  }
  const regs = readStorage(STORAGE_KEYS.registrations, null);
  if (!Array.isArray(regs)) {
    writeStorage(STORAGE_KEYS.registrations, []);
  }
};

const sortItems = (items, sortField) => {
  if (!sortField) return [...items];
  const desc = sortField.startsWith('-');
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
  items.filter((item) =>
    Object.entries(query).every(([key, value]) => item?.[key] === value)
  );

const getEvents = () => readStorage(STORAGE_KEYS.events, defaultEvents);
const setEvents = (events) => writeStorage(STORAGE_KEYS.events, events);
const getRegistrations = () => readStorage(STORAGE_KEYS.registrations, []);
const setRegistrations = (regs) => writeStorage(STORAGE_KEYS.registrations, regs);

ensureSeeded();

const eventEntity = {
  async list(sort) {
    return sortItems(getEvents(), sort);
  },
  async filter(query, sort, limit) {
    let result = filterItems(getEvents(), query);
    result = sortItems(result, sort);
    if (typeof limit === 'number') result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = {
      ...data,
      id: makeId(),
      status: data.status || 'brouillon',
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    const events = getEvents();
    events.unshift(next);
    setEvents(events);
    return next;
  },
  async update(id, patch) {
    const events = getEvents();
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');
    const updated = { ...events[index], ...patch, updated_date: nowIso() };
    events[index] = updated;
    setEvents(events);
    return updated;
  },
  async delete(id) {
    setEvents(getEvents().filter((e) => e.id !== id));
    setRegistrations(getRegistrations().filter((r) => r.event_id !== id));
    return { success: true };
  },
};

const registrationEntity = {
  async list(sort) {
    return sortItems(getRegistrations(), sort || '-created_date');
  },
  async filter(query, sort, limit) {
    let result = filterItems(getRegistrations(), query);
    result = sortItems(result, sort || '-created_date');
    if (typeof limit === 'number') result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = {
      ...data,
      id: makeId(),
      status: data.status || 'en_attente',
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    const regs = getRegistrations();
    regs.unshift(next);
    setRegistrations(regs);
    return next;
  },
  async update(id, patch) {
    const regs = getRegistrations();
    const index = regs.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Registration not found');
    const updated = { ...regs[index], ...patch, updated_date: nowIso() };
    regs[index] = updated;
    setRegistrations(regs);
    return updated;
  },
  async delete(id) {
    setRegistrations(getRegistrations().filter((r) => r.id !== id));
    return { success: true };
  },
};

const auth = {
  async me() {
    const user = readStorage(STORAGE_KEYS.currentUser, null);
    if (!user) throw new Error('Not authenticated');
    return user;
  },
  logout(redirectTo) {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.currentUser);
      window.localStorage.removeItem('base44_access_token');
      window.localStorage.removeItem('base44_token');
    } catch {
      // no-op
    }
    if (redirectTo) window.location.assign(redirectTo);
  },
  redirectToLogin(redirectTo) {
    if (redirectTo) window.location.assign(redirectTo);
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