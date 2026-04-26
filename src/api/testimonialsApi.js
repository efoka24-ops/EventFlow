import { apiGet } from "./apiClient";

export const fetchTestimonials = () => apiGet("/testimonials", { token: null });
