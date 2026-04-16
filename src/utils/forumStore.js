/**
 * Forum store using localStorage — no backend or auth required.
 * All CRUD ops are synchronous with localStorage persistence.
 */

const THREADS_KEY = 'fpd_forum_threads';
const REPLIES_KEY = 'fpd_forum_replies';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadThreads() {
  try { return JSON.parse(localStorage.getItem(THREADS_KEY) || '[]'); } catch { return []; }
}
function saveThreads(threads) {
  try { localStorage.setItem(THREADS_KEY, JSON.stringify(threads)); } catch {}
}
function loadReplies() {
  try { return JSON.parse(localStorage.getItem(REPLIES_KEY) || '[]'); } catch { return []; }
}
function saveReplies(replies) {
  try { localStorage.setItem(REPLIES_KEY, JSON.stringify(replies)); } catch {}
}

export const threadStore = {
  list() {
    const threads = loadThreads();
    return [...threads].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  },

  get(id) {
    return loadThreads().find(t => t.id === id) || null;
  },

  create(data) {
    const thread = {
      id: uid(),
      created_date: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      views: 0,
      reply_count: 0,
      report_count: 0,
      is_pinned: false,
      is_locked: false,
      is_hidden: false,
      is_reported: false,
      ...data,
    };
    const threads = loadThreads();
    threads.unshift(thread);
    saveThreads(threads);
    return thread;
  },

  update(id, patch) {
    const threads = loadThreads();
    const idx = threads.findIndex(t => t.id === id);
    if (idx !== -1) {
      threads[idx] = { ...threads[idx], ...patch };
      saveThreads(threads);
      return threads[idx];
    }
    return null;
  },

  delete(id) {
    const threads = loadThreads().filter(t => t.id !== id);
    saveThreads(threads);
    // Also remove replies for this thread
    const replies = loadReplies().filter(r => r.thread_id !== id);
    saveReplies(replies);
  },
};

export const replyStore = {
  listByThread(threadId) {
    return loadReplies()
      .filter(r => r.thread_id === threadId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  },

  create(data) {
    const reply = {
      id: uid(),
      created_date: new Date().toISOString(),
      report_count: 0,
      is_hidden: false,
      is_reported: false,
      ...data,
    };
    const replies = loadReplies();
    replies.push(reply);
    saveReplies(replies);

    // Increment reply_count on thread
    const threads = loadThreads();
    const idx = threads.findIndex(t => t.id === data.thread_id);
    if (idx !== -1) {
      threads[idx].reply_count = (threads[idx].reply_count || 0) + 1;
      threads[idx].last_activity = new Date().toISOString();
      saveThreads(threads);
    }

    return reply;
  },

  update(id, patch) {
    const replies = loadReplies();
    const idx = replies.findIndex(r => r.id === id);
    if (idx !== -1) {
      replies[idx] = { ...replies[idx], ...patch };
      saveReplies(replies);
      return replies[idx];
    }
    return null;
  },

  delete(id) {
    const all = loadReplies();
    const target = all.find(r => r.id === id);
    const replies = all.filter(r => r.id !== id);
    saveReplies(replies);

    // Decrement reply_count on thread
    if (target) {
      const threads = loadThreads();
      const idx = threads.findIndex(t => t.id === target.thread_id);
      if (idx !== -1) {
        threads[idx].reply_count = Math.max(0, (threads[idx].reply_count || 1) - 1);
        saveThreads(threads);
      }
    }
  },
};
