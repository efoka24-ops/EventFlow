import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

// ─── STATS ───────────────────────────────────────────────────────────────────
export const fetchAdminStats = () => apiGet("/admin/stats");
export const fetchAdminGrowth = (months = 6) => apiGet(`/admin/stats/growth?months=${months}`);

// ─── PARTICIPANTS ─────────────────────────────────────────────────────────────
export const listParticipants = ({ search, limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.set("search", search);
  return apiGet(`/admin/participants?${params}`);
};
export const getParticipantHistory = (email) => apiGet(`/admin/participants/${encodeURIComponent(email)}/history`);

// ─── ORGANIZERS ──────────────────────────────────────────────────────────────
export const listOrganizers = ({ search, status, limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return apiGet(`/admin/organizers?${params}`);
};
export const createOrganizer = (data) => apiPost("/admin/organizers", data);
export const suspendOrganizer = (id, reason) => apiPatch(`/admin/organizers/${id}/suspend`, { reason });
export const unsuspendOrganizer = (id) => apiPatch(`/admin/organizers/${id}/unsuspend`, {});
export const verifyOrganizer = (id) => apiPatch(`/admin/organizers/${id}/verify`, {});
export const deleteOrganizer = (id) => apiDelete(`/admin/organizers/${id}`);

// ─── ROLES & ADMIN ACCOUNTS ──────────────────────────────────────────────────
export const listAdminAccounts = () => apiGet("/admin/roles/accounts");
export const createAdminAccount = (data) => apiPost("/admin/roles/accounts", data);
export const updateAdminAccount = (id, data) => apiPatch(`/admin/roles/accounts/${id}`, data);
export const deleteAdminAccount = (id) => apiDelete(`/admin/roles/accounts/${id}`);

// ─── EVENTS APPROVAL & FEATURED ──────────────────────────────────────────────
export const approveEvent = (id, status) => apiPatch(`/admin/events/${id}/approve`, { status });
export const toggleEventFeatured = (id) => apiPatch(`/admin/events/${id}/featured`, {});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export const listAdminCategories = () => apiGet("/admin/categories");
export const createCategory = (data) => apiPost("/admin/categories", data);
export const updateCategory = (id, data) => apiPatch(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => apiDelete(`/admin/categories/${id}`);

// ─── REVENUE ─────────────────────────────────────────────────────────────────
export const fetchRevenue = (months = 6) => apiGet(`/admin/revenue?months=${months}`);

// ─── PLATFORM SETTINGS ───────────────────────────────────────────────────────
export const fetchSettings = (category) => {
  const params = category ? `?category=${category}` : "";
  return apiGet(`/admin/settings${params}`);
};
export const updateSetting = (key, value) => apiPatch(`/admin/settings/${key}`, { value });

// ─── PROMO CODES ─────────────────────────────────────────────────────────────
export const listPromoCodes = () => apiGet("/admin/promo-codes");
export const createPromoCode = (data) => apiPost("/admin/promo-codes", data);
export const togglePromoCode = (id) => apiPatch(`/admin/promo-codes/${id}/toggle`, {});
export const deletePromoCode = (id) => apiDelete(`/admin/promo-codes/${id}`);

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const listReports = (status) => apiGet(`/admin/reports${status ? `?status=${status}` : ""}`);
export const resolveReport = (id, data) => apiPatch(`/admin/reports/${id}/resolve`, data);

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
export const fetchActivityLog = () => apiGet("/admin/activity-log");

// ─── TESTIMONIALS (admin) ─────────────────────────────────────────────────────
export const listAdminTestimonials = () => apiGet("/testimonials/admin");
export const createTestimonial = (data) => apiPost("/testimonials/admin", data);
export const updateTestimonial = (id, data) => apiPatch(`/testimonials/admin/${id}`, data);
export const toggleTestimonial = (id) => apiPatch(`/testimonials/admin/${id}/toggle`, {});
export const deleteTestimonial = (id) => apiDelete(`/testimonials/admin/${id}`);
