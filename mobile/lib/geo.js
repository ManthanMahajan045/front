import * as Location from "expo-location";

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") throw new Error("Location permission is required.");
  const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: result.coords.latitude,
    longitude: result.coords.longitude,
    accuracy: result.coords.accuracy || null
  };
}

export async function reverseGeocode(latitude, longitude) {
  const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + latitude + "&lon=" + longitude + "&zoom=18";
  const response = await fetch(url, { headers: { "User-Agent": "RoadSense/1.0" } });
  if (!response.ok) throw new Error("Reverse geocoding failed.");
  const data = await response.json();
  return data.display_name || latitude.toFixed(5) + ", " + longitude.toFixed(5);
}

export async function searchPlaces(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=in&q=" + encodeURIComponent(trimmed);
  const response = await fetch(url, { headers: { "User-Agent": "RoadSense/1.0" } });
  if (!response.ok) throw new Error("Location search failed.");
  const data = await response.json();
  return data.map(function (item, index) {
    return {
      id: "geo-" + index + "-" + item.place_id,
      name: item.name || item.display_name.split(",")[0],
      address: item.display_name,
      coordinate: { latitude: Number(item.lat), longitude: Number(item.lon) }
    };
  });
}

export async function getRoutes(start, destination, hazards) {
  const waypoints = start.longitude + "," + start.latitude + ";" + destination.longitude + "," + destination.latitude;
  const url = "https://router.project-osrm.org/route/v1/driving/" + waypoints + "?alternatives=3&steps=true&overview=full&geometries=geojson";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Routing failed (" + response.status + ").");
  const data = await response.json();
  if (data.code !== "Ok" || !data.routes || !data.routes.length) throw new Error("No route found.");

  function nearestDistance(points, coordinate) {
    let best = Infinity;
    points.forEach(function (point) {
      best = Math.min(best, distanceKm(point[1], point[0], coordinate.latitude, coordinate.longitude) * 1000);
    });
    return best;
  }

  return data.routes.map(function (route) {
    let score = 0;
    const hits = [];
    (hazards || []).forEach(function (hazard) {
      const distance = nearestDistance(route.geometry.coordinates, hazard.coordinate);
      const radius = hazard.severity === "red" ? 500 : hazard.severity === "orange" ? 350 : 250;
      if (distance <= radius) {
        const weight = hazard.severity === "red" ? 5 : hazard.severity === "orange" ? 3 : 1;
        score += weight * Math.max(0, 1 - distance / radius);
        hits.push(Object.assign({}, hazard, { routeDistance: Math.round(distance) }));
      }
    });
    return Object.assign({}, route, { hazardScore: score, hazards: hits });
  }).sort(function (a, b) {
    return (a.duration + a.hazardScore * 90) - (b.duration + b.hazardScore * 90);
  }).map(function (route, index) {
    return Object.assign({}, route, { isRecommended: index === 0 });
  });
}
