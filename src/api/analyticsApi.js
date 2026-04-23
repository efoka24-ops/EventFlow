import { apiGet, apiPost, apiRequest } from "./apiClient";

const buildQs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const listSiteSessions = (params = {}) =>
  apiGet(`/site-sessions${buildQs(params)}`);

export const upsertSessionHeartbeat = (sessionId, data) =>
  apiRequest(`/site-sessions/${sessionId}/heartbeat`, {
    method: "PUT",
    body: JSON.stringify(data),
    token: null,
  });

export const listUserActions = (params = {}) =>
  apiGet(`/user-actions${buildQs(params)}`);

export const createUserAction = (data) =>
  apiPost("/user-actions", data, { token: null });

export const listEventFeedback = (params = {}) =>
  apiGet(`/event-feedback${buildQs(params)}`);

export const createEventFeedback = (data) =>
  apiPost("/event-feedback", data, { token: null });

export const deleteEventFeedback = (id) =>
  apiRequest(`/event-feedback/${id}`, { method: "DELETE" });
