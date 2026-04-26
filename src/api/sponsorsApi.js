import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export const listSponsors = (params = {}) => {
  const qs = params.event_id ? `?event_id=${params.event_id}` : "";
  return apiGet(`/sponsors${qs}`);
};

export const createSponsor = (data) => apiPost("/sponsors", data);
export const updateSponsor = (id, data) => apiPatch(`/sponsors/${id}`, data);
export const deleteSponsor = (id) => apiDelete(`/sponsors/${id}`);
