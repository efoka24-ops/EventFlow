import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { upsertSessionHeartbeat } from "@/api/analyticsApi";
import { trackUserAction } from "@/lib/trackUserAction";
import { getParticipantEmail } from "@/lib/participantSession";
import { getCreatorEmail, getCreatorPhone } from "@/lib/creatorSession";

const SESSION_ID_KEY = "eventflow_site_session_id";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getBrowserName = (userAgent) => {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("samsungbrowser/")) return "Samsung Internet";
  if (ua.includes("ucbrowser/")) return "UC Browser";
  if (ua.includes("brave/")) return "Brave";
  return "Other";
};

const extractVersion = (ua, token) => {
  const regex = new RegExp(`${token}\\/(\\d+(?:\\.\\d+)*)`, "i");
  const match = ua.match(regex);
  return match ? match[1] : "";
};

const getBrowserVersion = (userAgent) => {
  const ua = String(userAgent || "");
  if (/Edg\//i.test(ua)) return extractVersion(ua, "Edg");
  if (/OPR\//i.test(ua)) return extractVersion(ua, "OPR");
  if (/Chrome\//i.test(ua)) return extractVersion(ua, "Chrome");
  if (/Firefox\//i.test(ua)) return extractVersion(ua, "Firefox");
  if (/Version\//i.test(ua) && /Safari\//i.test(ua)) return extractVersion(ua, "Version");
  return "";
};

const getOperatingSystem = (userAgent) => {
  const ua = String(userAgent || "");
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
};

const getDeviceType = (userAgent) => {
  const ua = String(userAgent || "").toLowerCase();
  if (ua.includes("tablet") || ua.includes("ipad")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("android")) return "Mobile";
  return "Desktop";
};

const getOrCreateSessionId = () => {
  if (typeof window === "undefined") return `ssr-${Date.now()}`;
  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (existing && UUID_REGEX.test(existing)) return existing;
  const next = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "00000000-0000-4000-8000-000000000000".replace(/[08]/g, (c) =>
        (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16)
      );
  window.sessionStorage.setItem(SESSION_ID_KEY, next);
  return next;
};

export default function SiteAnalyticsTracker() {
  const location = useLocation();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const getIdentityPayload = () => {
    const creatorEmail = getCreatorEmail();
    const participantEmail = getParticipantEmail();
    const creatorPhone = getCreatorPhone();
    return {
      user_email: creatorEmail || participantEmail || null,
      user_phone: creatorPhone || null,
      account_type: creatorEmail || creatorPhone ? "creator" : participantEmail ? "participant" : "visitor",
    };
  };

  useEffect(() => {
    const startedAt = new Date().toISOString();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const browserName = getBrowserName(userAgent);
    const browserVersion = getBrowserVersion(userAgent);

    upsertSessionHeartbeat(sessionId, {
      started_at: startedAt,
      last_seen_at: startedAt,
      is_active: true,
      page_path: location.pathname,
      user_agent: userAgent,
      browser: browserName,
      browser_version: browserVersion,
      browser_full: browserVersion ? `${browserName} ${browserVersion}` : browserName,
      os: getOperatingSystem(userAgent),
      device_type: getDeviceType(userAgent),
      language: typeof navigator !== "undefined" ? navigator.language : "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      ...getIdentityPayload(),
    }).catch(() => {});

    // Best effort IP geolocation for admin metrics.
    fetch("https://ipapi.co/json/")
      .then((response) => (response.ok ? response.json() : null))
      .then((geo) => {
        if (!geo) return;
        return upsertSessionHeartbeat(sessionId, {
          country: geo.country_name || geo.country || null,
          city: geo.city || null,
          region: geo.region || null,
          ip: geo.ip || null,
        });
      })
      .catch(() => {});

    // Background device geolocation (best effort, user permission required).
    let geoWatchId = null;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords || {};
          upsertSessionHeartbeat(sessionId, {
            geo_source: "device",
            geo_latitude: coords.latitude ?? null,
            geo_longitude: coords.longitude ?? null,
            geo_accuracy_m: coords.accuracy ?? null,
            geo_altitude_m: coords.altitude ?? null,
            geo_altitude_accuracy_m: coords.altitudeAccuracy ?? null,
            geo_heading_deg: coords.heading ?? null,
            geo_speed_mps: coords.speed ?? null,
            geo_timestamp: position.timestamp ? new Date(position.timestamp).toISOString() : new Date().toISOString(),
          }).catch(() => {});
        },
        () => {
          // Keep IP fallback data when device permission is denied.
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    }

    const interval = setInterval(() => {
      upsertSessionHeartbeat(sessionId, {
        last_seen_at: new Date().toISOString(),
        is_active: true,
        ...getIdentityPayload(),
      }).catch(() => {});
    }, 60000);

    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        upsertSessionHeartbeat(sessionId, {
          last_seen_at: new Date().toISOString(),
          is_active: false,
          ...getIdentityPayload(),
        }).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onHidden);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onHidden);
      if (geoWatchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchId);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    upsertSessionHeartbeat(sessionId, {
      last_seen_at: new Date().toISOString(),
      is_active: true,
      page_path: location.pathname,
      ...getIdentityPayload(),
    }).catch(() => {});

    trackUserAction({
      action: "page_view",
      session_id: sessionId,
      page_path: location.pathname,
      context: "navigation",
    });
  }, [location.pathname, sessionId]);

  return null;
}
