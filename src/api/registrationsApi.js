import { apiGet, apiPost, apiPatch, apiDelete, apiRequest } from "./apiClient";

const buildQs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const listRegistrations = (params = {}) =>
  apiGet(`/registrations${buildQs(params)}`);

// Public — no auth required (Eventbrite-style)
export const createRegistration = (data) =>
  apiPost("/registrations", data);

// Public lookup by email — no auth required
export const getMyTickets = (email) =>
  apiRequest(`/registrations/my-tickets?email=${encodeURIComponent(email)}`, { method: "GET", token: null });

export const updateRegistration = (id, data) =>
  apiPatch(`/registrations/${id}`, data);

export const deleteRegistration = (id) =>
  apiDelete(`/registrations/${id}`);
