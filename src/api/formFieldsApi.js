import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export const listFormFields = (eventId, includeHidden = false) =>
  apiGet(`/form-fields?event_id=${eventId}${includeHidden ? "&include_hidden=true" : ""}`);

export const createFormField = (data) => apiPost("/form-fields", data);

export const updateFormField = (id, data) => apiPatch(`/form-fields/${id}`, data);

export const deleteFormField = (id) => apiDelete(`/form-fields/${id}`);
