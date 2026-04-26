import { apiGet } from "./apiClient";

export const fetchPublicSettings = () => apiGet("/public-settings");
