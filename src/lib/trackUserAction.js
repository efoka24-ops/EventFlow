import { base44 } from "@/api/base44Client";
import { getParticipantEmail } from "@/lib/participantSession";

export const trackUserAction = async (payload = {}) => {
  const email = payload.user_email || getParticipantEmail() || null;
  const actionPayload = {
    action: payload.action || "unknown",
    user_email: email,
    session_id: payload.session_id || null,
    page_path: payload.page_path || (typeof window !== "undefined" ? window.location.pathname : null),
    context: payload.context || null,
    event_id: payload.event_id || null,
    event_title: payload.event_title || null,
    event_category: payload.event_category || null,
    metadata: payload.metadata || null,
    occurred_at: new Date().toISOString(),
  };

  try {
    await base44.entities.UserAction.create(actionPayload);
  } catch {
    // no-op: tracking must never break UX
  }
};
