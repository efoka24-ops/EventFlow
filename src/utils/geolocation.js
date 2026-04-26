// Geolocation utility with caching to request permission only once
const GEO_CACHE_KEY = "eventflow_geo_cache";
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedGeolocation = async () => {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < GEO_CACHE_TTL) {
        return data.geo;
      }
      localStorage.removeItem(GEO_CACHE_KEY);
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

export const requestGeolocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || null,
        };
        // Cache for 24 hours
        try {
          localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ geo, timestamp: Date.now() }));
        } catch {
          // Ignore cache errors
        }
        resolve(geo);
      },
      (error) => {
        console.warn("[geolocation] Failed:", error.message);
        resolve(null);
      },
      { timeout: 10000 }
    );
  });
};

export const getGeolocation = async () => {
  const cached = await getCachedGeolocation();
  if (cached) return cached;
  return requestGeolocation();
};
