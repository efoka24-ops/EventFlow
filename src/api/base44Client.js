const STORAGE_KEYS = {
  events: "eventflow_events",
  registrations: "eventflow_registrations",
  helpArticles: "eventflow_help_articles",
  currentUser: "eventflow_current_user",
};

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const REMOTE_EVENTS_URL =
  env.VITE_EVENTFLOW_EVENTS_ENDPOINT ||
  env.VITE_EVENTFLOW_EVENTS_BLOB_URL ||
  "/storage/events";
const REMOTE_REGISTRATIONS_URL =
  env.VITE_EVENTFLOW_REGISTRATIONS_ENDPOINT ||
  env.VITE_EVENTFLOW_REGISTRATIONS_BLOB_URL ||
  "/storage/registrations";
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
    id: "evt-figuil-2026",
    title: "Grand Atelier de Conférence — Investir en soi : Éducation, Emploi et Avenir pour les Jeunes de Figuil",
    description:
      "Emmanuel - Kesmo et ses partenaires organisent un grand atelier de conférence dédié à la jeunesse du Septentrion. Au programme : des panels d'experts, des témoignages inspirants et des ateliers pratiques autour de trois axes majeurs — l'éducation comme levier d'émancipation, l'emploi et l'entrepreneuriat comme moteurs d'insertion, et la construction d'un avenir durable pour les jeunes de Figuil et du Grand Nord. Une journée de réflexion, d'échange et d'action. Entrée libre.",
    category: "conference",
    date_start: "2026-05-19T09:00:00.000Z",
    date_end: "2026-05-19T15:00:00.000Z",
    location_name: "Karewa Cap Vert",
    city: "Figuil",
    address: "Karewa Cap Vert, Figuil",
    max_participants: 500,
    price: 0,
    status: "publie",
    tags: "jeunesse,éducation,emploi,conférence,figuil,grand-nord",
    image_url: "",
    created_date: nowIso(),
    updated_date: nowIso(),
  },
];

const defaultHelpArticles = [
  {
    id: "help-inscription-evenement",
    topic_id: "inscription",
    topic_title: "Inscription et billets",
    topic_description: "Tout ce qui concerne l'inscription, la validation et le téléchargement du billet.",
    topic_order: 1,
    title: "Comment s'inscrire à un événement ?",
    content:
      "Ouvrez la page de l'événement, remplissez le formulaire puis cliquez sur S'inscrire. Une fois le formulaire envoyé, votre demande passe en statut En attente.",
    article_order: 1,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-statut-billet",
    topic_id: "inscription",
    topic_title: "Inscription et billets",
    topic_description: "Tout ce qui concerne l'inscription, la validation et le téléchargement du billet.",
    topic_order: 1,
    title: "Comment suivre le statut de mon billet ?",
    content:
      "Allez dans Mes billets, connectez-vous avec votre email, puis consultez l'état de chaque demande: En attente, Validée ou Refusée.",
    article_order: 2,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-telechargement-billet",
    topic_id: "inscription",
    topic_title: "Inscription et billets",
    topic_description: "Tout ce qui concerne l'inscription, la validation et le téléchargement du billet.",
    topic_order: 1,
    title: "Comment télécharger mon billet PDF ?",
    content:
      "Depuis la confirmation d'inscription ou la page Mes billets, cliquez sur Télécharger le billet. Le document PDF est généré avec les informations de l'événement et le statut actuel.",
    article_order: 3,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-proposer-evenement",
    topic_id: "creation-evenement",
    topic_title: "Création d'événements",
    topic_description: "Guides pour proposer et publier un événement depuis l'espace public.",
    topic_order: 2,
    title: "Comment proposer mon propre événement ?",
    content:
      "Cliquez sur Proposer dans le menu, complétez le formulaire (titre, date, lieu, description, image), puis soumettez. L'événement est publié immédiatement.",
    article_order: 1,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-image-qualite",
    topic_id: "creation-evenement",
    topic_title: "Création d'événements",
    topic_description: "Guides pour proposer et publier un événement depuis l'espace public.",
    topic_order: 2,
    title: "Pourquoi mon image semble floue ou dégradée ?",
    content:
      "Utilisez une image nette (au moins 1200 px de large) avec un bon éclairage. Les images très lourdes sont optimisées automatiquement pour préserver la qualité tout en restant rapides à charger.",
    article_order: 2,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-modifier-evenement",
    topic_id: "creation-evenement",
    topic_title: "Création d'événements",
    topic_description: "Guides pour proposer et publier un événement depuis l'espace public.",
    topic_order: 2,
    title: "Puis-je modifier un événement après publication ?",
    content:
      "Oui. Un administrateur peut modifier toutes les informations depuis le back-office, y compris dates, tarifs, visuel et statut.",
    article_order: 3,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-validation-inscriptions",
    topic_id: "admin",
    topic_title: "Administration",
    topic_description: "Aide rapide pour la gestion côté organisateur/admin.",
    topic_order: 3,
    title: "Comment valider ou refuser une inscription ?",
    content:
      "Dans Admin > Inscriptions, ouvrez le menu d'une ligne puis choisissez Valider ou Refuser. Le statut est mis à jour et une notification email peut être envoyée au participant.",
    article_order: 1,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-exports",
    topic_id: "admin",
    topic_title: "Administration",
    topic_description: "Aide rapide pour la gestion côté organisateur/admin.",
    topic_order: 3,
    title: "Comment exporter les inscriptions ?",
    content:
      "Depuis Admin > Inscriptions, utilisez Export CSV ou Export Excel pour générer la liste des participants selon le filtre actif.",
    article_order: 2,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
  {
    id: "help-donnees-partagees",
    topic_id: "admin",
    topic_title: "Administration",
    topic_description: "Aide rapide pour la gestion côté organisateur/admin.",
    topic_order: 3,
    title: "Les données sont-elles visibles sur plusieurs appareils ?",
    content:
      "Oui. Les événements et inscriptions sont synchronisés via le stockage distant configuré sur le projet.",
    article_order: 3,
    created_date: nowIso(),
    updated_date: nowIso(),
  },
];

const memoryStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
  removeItem(key) {
    this.store.delete(key);
  },
};

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const getStorage = () => {
  if (!canUseStorage()) return memoryStorage;
  try {
    // Access can throw in restricted browsers (privacy mode / blocked storage).
    const probeKey = "__eventflow_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
};

const readStorage = (key, fallback) => {
  const storage = getStorage();
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  const storage = getStorage();
  try {
    storage.setItem(key, JSON.stringify(value));
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
    const hasBody = Object.prototype.hasOwnProperty.call(options, "body");
    const response = await fetch(url, {
      ...options,
      // Keep GET requests simple to reduce CORS/preflight failures.
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : { Accept: "application/json" }),
        ...(options.headers || {}),
      },
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

const ensureHelpArticles = async () => {
  const local = readStorage(STORAGE_KEYS.helpArticles, defaultHelpArticles);
  if (!Array.isArray(local) || local.length === 0) {
    writeStorage(STORAGE_KEYS.helpArticles, defaultHelpArticles);
    return defaultHelpArticles;
  }
  return local;
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

const saveHelpArticles = async (articles) => {
  writeStorage(STORAGE_KEYS.helpArticles, articles);
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

const helpArticleEntity = {
  async list(sort) {
    return sortItems(await ensureHelpArticles(), sort || "topic_order");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureHelpArticles(), query);
    result = sortItems(result, sort || "topic_order");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = {
      ...data,
      id: makeId(),
      article_order: Number(data.article_order || 0),
      topic_order: Number(data.topic_order || 0),
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    const articles = await ensureHelpArticles();
    const updated = [next, ...articles];
    await saveHelpArticles(updated);
    return next;
  },
  async update(id, patch) {
    const articles = await ensureHelpArticles();
    const index = articles.findIndex((article) => article.id === id);
    if (index === -1) throw new Error("Help article not found");
    const updatedArticle = {
      ...articles[index],
      ...patch,
      article_order: Number(patch.article_order ?? articles[index].article_order ?? 0),
      topic_order: Number(patch.topic_order ?? articles[index].topic_order ?? 0),
      updated_date: nowIso(),
    };
    const next = [...articles];
    next[index] = updatedArticle;
    await saveHelpArticles(next);
    return updatedArticle;
  },
  async delete(id) {
    const articles = await ensureHelpArticles();
    await saveHelpArticles(articles.filter((article) => article.id !== id));
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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const compressImageToDataUrl = (file, maxSide = 1800) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas context unavailable");

        context.drawImage(image, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/webp", 0.9);
        URL.revokeObjectURL(objectUrl);
        resolve(compressed);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode image"));
    };

    image.src = objectUrl;
  });

const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (!(file instanceof File)) throw new Error("Invalid file");

      // Keep image quality high and make URL persistent across refresh/devices.
      const originalDataUrl = await readFileAsDataUrl(file);
      if (originalDataUrl.length <= 1_500_000) {
        return { file_url: originalDataUrl };
      }

      const compressedDataUrl = await compressImageToDataUrl(file);
      return { file_url: compressedDataUrl };
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
    HelpArticle: helpArticleEntity,
  },
  integrations,
};

export const base44Public = base44;
export const canUseBase44 = false;