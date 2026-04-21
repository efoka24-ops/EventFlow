const STORAGE_KEYS = {
  events: "eventflow_events",
  registrations: "eventflow_registrations",
  helpArticles: "eventflow_help_articles",
  siteSessions: "eventflow_site_sessions",
  eventFeedback: "eventflow_event_feedback",
  userActions: "eventflow_user_actions",
  creatorAccounts: "eventflow_creator_accounts",
  currentUser: "eventflow_current_user",
};

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const REMOTE_EVENTS_URL =
  env.VITE_EVENTFLOW_EVENTS_ENDPOINT ||
  env.VITE_EVENTFLOW_EVENTS_BLOB_URL ||
  "/api/events";
const REMOTE_REGISTRATIONS_URL =
  env.VITE_EVENTFLOW_REGISTRATIONS_ENDPOINT ||
  env.VITE_EVENTFLOW_REGISTRATIONS_BLOB_URL ||
  "/api/registrations";
const REMOTE_ANALYTICS_URL =
  env.VITE_EVENTFLOW_ANALYTICS_ENDPOINT ||
  env.VITE_EVENTFLOW_ANALYTICS_BLOB_URL ||
  "/api/site-sessions";
const REMOTE_FEEDBACK_URL =
  env.VITE_EVENTFLOW_FEEDBACK_ENDPOINT ||
  env.VITE_EVENTFLOW_FEEDBACK_BLOB_URL ||
  "/api/event-feedback";
const REMOTE_USER_ACTIONS_URL =
  env.VITE_EVENTFLOW_USER_ACTIONS_ENDPOINT ||
  env.VITE_EVENTFLOW_USER_ACTIONS_BLOB_URL ||
  "/api/user-actions";
const REMOTE_DISABLED = String(env.VITE_EVENTFLOW_REMOTE_DISABLED || "false") === "true";
const REMOTE_ENABLED = !REMOTE_DISABLED && Boolean(REMOTE_EVENTS_URL && REMOTE_REGISTRATIONS_URL);
const REMOTE_ANALYTICS_ENABLED = !REMOTE_DISABLED && Boolean(REMOTE_ANALYTICS_URL);
const REMOTE_FEEDBACK_ENABLED = !REMOTE_DISABLED && Boolean(REMOTE_FEEDBACK_URL);
const REMOTE_USER_ACTIONS_ENABLED = !REMOTE_DISABLED && Boolean(REMOTE_USER_ACTIONS_URL);

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

const defaultSiteSessions = [];
const defaultEventFeedback = [];
const defaultUserActions = [];
const defaultCreatorAccounts = [];

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
    if (Array.isArray(remote)) {
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

const ensureSiteSessions = async () => {
  const local = readStorage(STORAGE_KEYS.siteSessions, defaultSiteSessions);
  if (!REMOTE_ANALYTICS_ENABLED) {
    if (!Array.isArray(local)) writeStorage(STORAGE_KEYS.siteSessions, defaultSiteSessions);
    return Array.isArray(local) ? local : defaultSiteSessions;
  }

  try {
    const remote = await readRemoteCollection(REMOTE_ANALYTICS_URL);
    if (Array.isArray(remote)) {
      writeStorage(STORAGE_KEYS.siteSessions, remote);
      return remote;
    }
    const seed = Array.isArray(local) ? local : defaultSiteSessions;
    await writeRemoteCollection(REMOTE_ANALYTICS_URL, seed);
    writeStorage(STORAGE_KEYS.siteSessions, seed);
    return seed;
  } catch {
    return Array.isArray(local) ? local : defaultSiteSessions;
  }
};

const ensureEventFeedback = async () => {
  const local = readStorage(STORAGE_KEYS.eventFeedback, defaultEventFeedback);
  if (!REMOTE_FEEDBACK_ENABLED) {
    if (!Array.isArray(local)) writeStorage(STORAGE_KEYS.eventFeedback, defaultEventFeedback);
    return Array.isArray(local) ? local : defaultEventFeedback;
  }

  try {
    const remote = await readRemoteCollection(REMOTE_FEEDBACK_URL);
    if (Array.isArray(remote)) {
      writeStorage(STORAGE_KEYS.eventFeedback, remote);
      return remote;
    }
    const seed = Array.isArray(local) ? local : defaultEventFeedback;
    await writeRemoteCollection(REMOTE_FEEDBACK_URL, seed);
    writeStorage(STORAGE_KEYS.eventFeedback, seed);
    return seed;
  } catch {
    return Array.isArray(local) ? local : defaultEventFeedback;
  }
};

const ensureUserActions = async () => {
  const local = readStorage(STORAGE_KEYS.userActions, defaultUserActions);
  if (!REMOTE_USER_ACTIONS_ENABLED) {
    if (!Array.isArray(local)) writeStorage(STORAGE_KEYS.userActions, defaultUserActions);
    return Array.isArray(local) ? local : defaultUserActions;
  }

  try {
    const remote = await readRemoteCollection(REMOTE_USER_ACTIONS_URL);
    if (Array.isArray(remote)) {
      writeStorage(STORAGE_KEYS.userActions, remote);
      return remote;
    }
    const seed = Array.isArray(local) ? local : defaultUserActions;
    await writeRemoteCollection(REMOTE_USER_ACTIONS_URL, seed);
    writeStorage(STORAGE_KEYS.userActions, seed);
    return seed;
  } catch {
    return Array.isArray(local) ? local : defaultUserActions;
  }
};

const ensureCreatorAccounts = async () => {
  const local = readStorage(STORAGE_KEYS.creatorAccounts, defaultCreatorAccounts);
  if (!Array.isArray(local)) {
    writeStorage(STORAGE_KEYS.creatorAccounts, defaultCreatorAccounts);
    return defaultCreatorAccounts;
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

const saveSiteSessions = async (sessions) => {
  writeStorage(STORAGE_KEYS.siteSessions, sessions);
  if (REMOTE_ANALYTICS_ENABLED) {
    try {
      await writeRemoteCollection(REMOTE_ANALYTICS_URL, sessions);
    } catch {
      // keep local write as fallback
    }
  }
};

const saveEventFeedback = async (feedbackItems) => {
  writeStorage(STORAGE_KEYS.eventFeedback, feedbackItems);
  if (REMOTE_FEEDBACK_ENABLED) {
    try {
      await writeRemoteCollection(REMOTE_FEEDBACK_URL, feedbackItems);
    } catch {
      // keep local write as fallback
    }
  }
};

const saveUserActions = async (actions) => {
  writeStorage(STORAGE_KEYS.userActions, actions);
  if (REMOTE_USER_ACTIONS_ENABLED) {
    try {
      await writeRemoteCollection(REMOTE_USER_ACTIONS_URL, actions);
    } catch {
      // keep local write as fallback
    }
  }
};

const saveCreatorAccounts = async (accounts) => {
  writeStorage(STORAGE_KEYS.creatorAccounts, accounts);
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

const siteSessionEntity = {
  async list(sort) {
    return sortItems(await ensureSiteSessions(), sort || "-started_at");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureSiteSessions(), query);
    result = sortItems(result, sort || "-started_at");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = { ...data, id: data.id || makeId(), created_date: nowIso(), updated_date: nowIso() };
    if (REMOTE_ENABLED) {
      try {
        await fetchJson(`${REMOTE_ANALYTICS_URL}/${next.id}/heartbeat`, { method: "PUT", body: JSON.stringify(next) });
      } catch (err) {
        console.warn("Failed to create remote session:", err);
      }
    }
    const sessions = await ensureSiteSessions();
    const updated = [next, ...sessions];
    await saveSiteSessions(updated);
    return next;
  },
  async update(id, patch) {
    if (REMOTE_ENABLED) {
      try {
        await fetchJson(`${REMOTE_ANALYTICS_URL}/${id}/heartbeat`, { method: "PUT", body: JSON.stringify(patch) });
      } catch (err) {
        console.warn("Failed to update remote session:", err);
      }
    }
    const sessions = await ensureSiteSessions();
    const index = sessions.findIndex((session) => session.id === id);
    if (index === -1) throw new Error("Session not found");
    const updatedSession = { ...sessions[index], ...patch, updated_date: nowIso() };
    const next = [...sessions];
    next[index] = updatedSession;
    await saveSiteSessions(next);
    return updatedSession;
  },
  async upsertHeartbeat(id, patch = {}) {
    if (REMOTE_ENABLED) {
      try {
        const result = await fetchJson(`${REMOTE_ANALYTICS_URL}/${id}/heartbeat`, { method: "PUT", body: JSON.stringify(patch) });
        if (result) {
          // Sync local storage with server response
          const sessions = await ensureSiteSessions();
          const index = sessions.findIndex((s) => s.id === id);
          const next = [...sessions];
          if (index === -1) next.unshift(result);
          else next[index] = result;
          await saveSiteSessions(next);
          return result;
        }
      } catch (err) {
        console.warn("Failed to sync heartbeat:", err);
      }
    }

    const sessions = await ensureSiteSessions();
    const index = sessions.findIndex((session) => session.id === id);
    const now = nowIso();

    if (index === -1) {
      const base = {
        id,
        started_at: patch.started_at || now,
        last_seen_at: patch.last_seen_at || now,
        ended_at: patch.ended_at || null,
        is_active: patch.is_active !== false,
        page_paths: patch.page_path ? [patch.page_path] : [],
        minutes_spent: 0,
        created_date: now,
        updated_date: now,
      };
      const nextSession = { ...base, ...patch };
      const updated = [nextSession, ...sessions];
      await saveSiteSessions(updated);
      return nextSession;
    }

    const current = sessions[index];
    const currentPaths = Array.isArray(current.page_paths) ? current.page_paths : [];
    const mergedPaths = patch.page_path && !currentPaths.includes(patch.page_path)
      ? [...currentPaths, patch.page_path]
      : currentPaths;

    const startedAt = current.started_at || patch.started_at || now;
    const lastSeenAt = patch.last_seen_at || now;
    const minutesSpent = Math.max(
      Number(current.minutes_spent || 0),
      Math.round((new Date(lastSeenAt).getTime() - new Date(startedAt).getTime()) / 60000)
    );

    const updatedSession = {
      ...current,
      ...patch,
      started_at: startedAt,
      last_seen_at: lastSeenAt,
      page_paths: mergedPaths,
      minutes_spent: Number.isFinite(minutesSpent) ? minutesSpent : Number(current.minutes_spent || 0),
      updated_date: now,
    };

    const next = [...sessions];
    next[index] = updatedSession;
    await saveSiteSessions(next);
    return updatedSession;
  },
  async delete(id) {
    const sessions = await ensureSiteSessions();
    await saveSiteSessions(sessions.filter((session) => session.id !== id));
    return { success: true };
  },
};

const eventFeedbackEntity = {
  async list(sort) {
    return sortItems(await ensureEventFeedback(), sort || "-created_date");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureEventFeedback(), query);
    result = sortItems(result, sort || "-created_date");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = { ...data, id: makeId(), created_date: nowIso(), updated_date: nowIso() };
    const items = await ensureEventFeedback();
    const updated = [next, ...items];
    await saveEventFeedback(updated);
    return next;
  },
  async update(id, patch) {
    const items = await ensureEventFeedback();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Feedback not found");
    const updatedItem = { ...items[index], ...patch, updated_date: nowIso() };
    const next = [...items];
    next[index] = updatedItem;
    await saveEventFeedback(next);
    return updatedItem;
  },
  async delete(id) {
    const items = await ensureEventFeedback();
    await saveEventFeedback(items.filter((item) => item.id !== id));
    return { success: true };
  },
};

const userActionEntity = {
  async list(sort) {
    return sortItems(await ensureUserActions(), sort || "-created_date");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureUserActions(), query);
    result = sortItems(result, sort || "-created_date");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const next = {
      ...data,
      id: makeId(),
      created_date: nowIso(),
      updated_date: nowIso(),
    };
    if (REMOTE_ENABLED) {
      try {
        await fetchJson(REMOTE_USER_ACTIONS_URL, { method: "POST", body: JSON.stringify(next) });
      } catch (err) {
        console.warn("Failed to sync remote user action:", err);
      }
    }
    const actions = await ensureUserActions();
    const updated = [next, ...actions].slice(0, 10000);
    await saveUserActions(updated);
    return next;
  },
  async delete(id) {
    const actions = await ensureUserActions();
    await saveUserActions(actions.filter((item) => item.id !== id));
    return { success: true };
  },
};

const creatorAccountEntity = {
  async list(sort) {
    return sortItems(await ensureCreatorAccounts(), sort || "-created_date");
  },
  async filter(query, sort, limit) {
    let result = filterItems(await ensureCreatorAccounts(), query);
    result = sortItems(result, sort || "-created_date");
    if (typeof limit === "number") result = result.slice(0, limit);
    return result;
  },
  async create(data) {
    const accounts = await ensureCreatorAccounts();
    const email = String(data.email || "").trim().toLowerCase();
    const phone = String(data.phone || "").trim();

    if (email && accounts.some((item) => item.email === email)) {
      throw new Error("Email already used");
    }
    if (phone && accounts.some((item) => item.phone === phone)) {
      throw new Error("Phone already used");
    }

    const next = {
      ...data,
      email,
      phone,
      id: makeId(),
      created_date: nowIso(),
      updated_date: nowIso(),
    };

    const updated = [next, ...accounts];
    await saveCreatorAccounts(updated);
    return next;
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
    SiteSession: siteSessionEntity,
    EventFeedback: eventFeedbackEntity,
    UserAction: userActionEntity,
    CreatorAccount: creatorAccountEntity,
  },
  integrations,
};

export const base44Public = base44;
export const canUseBase44 = false;