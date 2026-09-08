const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getHazardAwareRoutes(start, destination, hazards = []) {
  const waypoints = `${start.lng},${start.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/${waypoints}?alternatives=3&steps=true&overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Routing failed (${response.status})`);
  const data = await response.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error(data.message || "No route found");

  return data.routes.map((route) => {
    const hazard = scoreRoute(route, hazards);
    return { ...route, hazardScore: hazard.score, hazards: hazard.hits };
  }).sort((a, b) => (a.duration + a.hazardScore * 90) - (b.duration + b.hazardScore * 90))
    .map((route, index) => ({ ...route, isRecommended: index === 0 }));
}

export function scoreRoute(route, hazards = []) {
  const points = route.geometry?.coordinates || [];
  let score = 0;
  const hits = [];
  hazards.forEach((hazard) => {
    if (!hazard.coordinates) return;
    const nearest = nearestPointDistanceMeters(points, hazard.coordinates);
    const radius = hazard.severity === "red" ? 500 : hazard.severity === "orange" ? 350 : 250;
    if (nearest <= radius) {
      const weight = hazard.severity === "red" ? 5 : hazard.severity === "orange" ? 3 : 1;
      score += weight * Math.max(0, 1 - nearest / radius);
      hits.push({ ...hazard, routeDistance: Math.round(nearest) });
    }
  });
  return { score, hits };
}

function nearestPointDistanceMeters(routePoints, coordinate) {
  let best = Infinity;
  for (let i = 0; i < routePoints.length; i += 1) {
    const [lng, lat] = routePoints[i];
    best = Math.min(best, haversineMeters(lat, lng, coordinate.lat, coordinate.lng));
  }
  return best;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
