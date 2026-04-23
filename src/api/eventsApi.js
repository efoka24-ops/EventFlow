import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

const buildQs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const listEvents = (params = {}) =>
  apiGet(`/events${buildQs(params)}`);

export const getEvent = (id) =>
  apiGet(`/events/${id}`);

export const createEvent = (data) =>
  apiPost("/events", data);

export const listMyEvents = () =>
  apiGet("/events/mine/list");

export const updateEvent = (id, data) =>
  apiPatch(`/events/${id}`, data);

export const deleteEvent = (id) =>
  apiDelete(`/events/${id}`);
