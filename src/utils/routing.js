const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getRoute(start, destination, { alternatives = true, avoidHazards = true } = {}) {
  const waypoints = `${start.lng},${start.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/${waypoints}?alternatives=${alternatives}&steps=true&overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Routing failed (${response.status})`);
  const data = await response.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error(data.message || "No route found");

  const routes = data.routes.map((route) => ({
    ...route,
    hazardScore: avoidHazards ? scoreRouteAgainstHazards(route, argumentsHazardsPlaceholder) : 0,
  }));

  return routes;
}

// Kept separate so the scoring algorithm can evolve without coupling it to the UI.
export function scoreRoute(route, hazards = []) {
  const points = route.geometry?.coordinates || [];
  let score = 0;
  const hits = [];

  hazards.forEach((hazard) => {
    const nearest = nearestPointDistanceMeters(points, hazard.coordinates);
    const radius = hazard.severity === "red" ? 500 : hazard.severity === "orange" ? 350 : 250;
    if (nearest <= radius) {
      const weight = hazard.severity === "red" ? 5 : hazard.severity === "orange" ? 3 : 1;
      score += weight * Math.max(0, 1 - nearest / radius);
      hits.push({ ...hazard, routeDistance: nearest });
    }
  });

  return { score, hits };
}

export async function getHazardAwareRoutes(start, destination, hazards = []) {
  const waypoints = `${start.lng},${start.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/${waypoints}?alternatives=3&steps=true&overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Routing failed (${response.status})`);
  const data = await response.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error(data.message || "No route found");

  return data.routes.map((route, index) => {
    const hazard = scoreRoute(route, hazards);
    return {
      ...route,
      hazardScore: hazard.score,
      hazards: hazard.hits,
      isRecommended: index === 0,
    };
  }).sort((a, b) => {
    // Safety is primary, but don't take absurd detours just to avoid one minor hazard.
    const aSafety = a.hazardScore * 90;
    const bSafety = b.hazardScore * 90;
    return (a.duration + aSafety) - (b.duration + bSafety);
  }).map((route, index) => ({ ...route, isRecommended: index === 0 }));
}

function nearestPointDistanceMeters(routePoints, coordinate) {
  let best = Infinity;
  for (let i = 0; i < routePoints.length; i += 1) {
    const [lng, lat] = routePoints[i];
    const d = haversineMeters(lat, lng, coordinate.lat, coordinate.lng);
    if (d < best) best = d;
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
