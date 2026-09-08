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

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// High-accuracy browser GPS. Instead of accepting the first fix, keep the
// GPS sensor open briefly and return the most accurate fresh fix received.
// This avoids many of the 100–200m stale/network-location readings.
export function getCurrentLocation({ timeout = 15000, targetAccuracy = 12 } = {}) {
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
      else reject(error || new Error("Unable to get a GPS fix"));
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
      // A timeout/error may still have produced a useful GPS fix. Return it.
      if (best) finish();
      else if (error?.code === 1) finish(error);
    };

    watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: timeout,
      maximumAge: 0,
    });

    timerId = window.setTimeout(() => finish(), timeout);
  });
}
