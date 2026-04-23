import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export const listHelpArticles = (sort) =>
  apiGet(sort ? `/help-articles?sort=${sort}` : "/help-articles");

export const createHelpArticle = (data) =>
  apiPost("/help-articles", data);

export const updateHelpArticle = (id, data) =>
  apiPatch(`/help-articles/${id}`, data);

export const deleteHelpArticle = (id) =>
  apiDelete(`/help-articles/${id}`);
