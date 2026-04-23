import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

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

export const createRegistration = (data) =>
  apiPost("/registrations", data);

export const updateRegistration = (id, data) =>
  apiPatch(`/registrations/${id}`, data);

export const deleteRegistration = (id) =>
  apiDelete(`/registrations/${id}`);
