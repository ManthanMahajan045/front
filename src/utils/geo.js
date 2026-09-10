// Distance between two latitude/longitude points, in km.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function reverseGeocode(lat, lng, timeout = 4000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("Reverse geocoding failed");
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } finally {
    window.clearTimeout(timer);
  }
}

// Fast browser location: accept a good-enough GPS fix quickly, while still
// allowing the browser to improve it for a short period. Waiting for 8–12m
// accuracy on laptops can take a long time because many laptops use Wi-Fi/IP
// location before a real GPS-capable source is available.
export function getCurrentLocation({ timeout = 8000, targetAccuracy = 50 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    let settled = false;
    let best = null;
    let watchId = null;
    let timerId = null;

    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timerId !== null) window.clearTimeout(timerId);
      if (best) resolve(best);
      else reject(error || new Error("Unable to get a location fix"));
    };

    const onPosition = (pos) => {
      const accuracy = Number(pos.coords.accuracy);
      if (!Number.isFinite(accuracy)) return;
      const next = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy,
        altitude: pos.coords.altitude ?? null,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
        timestamp: pos.timestamp,
      };
      if (!best || accuracy < best.accuracy) best = next;
      if (accuracy <= targetAccuracy) finish();
    };

    const onError = (error) => {
      if (best) finish();
      else finish(error);
    };

    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout,
      maximumAge: 15000,
    });
    timerId = window.setTimeout(() => finish(), timeout);
  });
}
