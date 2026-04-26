import { createUserAction } from "@/api/analyticsApi";
import { getParticipantEmail } from "@/lib/participantSession";
import { getCreatorPhone } from "@/lib/creatorSession";

export const trackUserAction = async (payload = {}) => {
  const email = payload.user_email || getParticipantEmail() || null;
  const phone = payload.user_phone || getCreatorPhone() || null;
  const incomingMetadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : null;
  const metadata = {
    ...(incomingMetadata || {}),
    user_phone: incomingMetadata?.user_phone || phone || null,
  };
  const actionPayload = {
    action: payload.action || "unknown",
    user_email: email,
    session_id: payload.session_id || null,
    page_path: payload.page_path || (typeof window !== "undefined" ? window.location.pathname : null),
    context: payload.context || null,
    event_id: payload.event_id || null,
    event_title: payload.event_title || null,
    event_category: payload.event_category || null,
    metadata,
    occurred_at: new Date().toISOString(),
  };

  try {
    await createUserAction(actionPayload);
  } catch {
    // no-op: tracking must never break UX
  }
};
