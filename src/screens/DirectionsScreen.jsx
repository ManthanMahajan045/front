import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { ArrowLeft, CheckCircle2, Clock3, Navigation, ShieldAlert } from "lucide-react";
import L from "leaflet";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { getHazardAwareRoutes } from "../utils/routing";
import { getCurrentLocation } from "../utils/geo";

const pin = L.divIcon({ className: "", html: "<div class=\"route-pin\"></div>", iconSize: [22, 22], iconAnchor: [11, 11] });

function FitRoute({ route, origin, destination }) {
  const map = useMap();
  useEffect(() => {
    const coords = route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
    if (coords.length) map.fitBounds(coords, { padding: [30, 30] });
    else if (origin && destination) map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [40, 40] });
  }, [route, origin, destination, map]);
  return null;
}

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}
function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

export default function DirectionsScreen({ onNavigate, selectedLocation, userLocation }) {
  const [origin, setOrigin] = useState(userLocation || null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const destination = selectedLocation?.coordinates;
  const route = routes[selectedRoute] || routes[0];
  const routeLine = useMemo(() => route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [], [route]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!destination) { setError("Choose a destination first."); setLoading(false); return; }
      setLoading(true); setError("");
      try {
        const start = origin || await getCurrentLocation({ timeout: 12000, targetAccuracy: 15 });
        if (cancelled) return;
        setOrigin(start);
        const result = await getHazardAwareRoutes(start, destination, confirmedHazards);
        if (!cancelled) { setRoutes(result); setSelectedRoute(0); }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not build a route.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [destination]);

  if (!destination) return <div className="screen"><div className="route-header"><button onClick={() => onNavigate("home")}><ArrowLeft size={20} /></button><strong>Directions</strong></div><div className="route-empty">Select a destination from Search to get an in-app route.</div><BottomNav active="home" onNavigate={onNavigate} /></div>;

  return (
    <div className="screen directions-screen">
      <div className="route-header">
        <button onClick={() => onNavigate("home")} aria-label="Back"><ArrowLeft size={20} /></button>
        <div><strong>Safe route</strong><span>RoadSense navigation</span></div>
        <Navigation size={20} />
      </div>

      <div className="route-map">
        {origin && <MapContainer center={[origin.lat, origin.lng]} zoom={14} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitRoute route={route} origin={origin} destination={destination} />
          {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: "#6d28d9", weight: 6, opacity: .9 }} />}
          <Marker position={[origin.lat, origin.lng]} icon={pin} />
          <Marker position={[destination.lat, destination.lng]} icon={pin} />
        </MapContainer>}
        {loading && <div className="route-loading">Building safest route…</div>}
      </div>

      <div className="route-sheet">
        <div className="route-destination"><span>TO</span><strong>{selectedLocation.name}</strong><small>{selectedLocation.address}</small></div>
        {error && <div className="route-error"><ShieldAlert size={17} /> {error}</div>}
        {route && <>
          <div className="route-summary">
            <div><Clock3 size={17} /><strong>{formatDuration(route.duration)}</strong><span>estimated</span></div>
            <div><Navigation size={17} /><strong>{formatDistance(route.distance)}</strong><span>driving</span></div>
            <div><ShieldAlert size={17} /><strong>{route.hazards.length ? route.hazards.length : "Clear"}</strong><span>hazards</span></div>
          </div>
          {route.hazards.length > 0 && <div className="hazard-warning"><ShieldAlert size={18} /><div><strong>Hazards on this route</strong><p>{route.hazards.slice(0, 2).map((h) => h.name).join(" • ")}</p></div></div>}
          <div className="route-options">
            {routes.map((candidate, index) => <button key={`${candidate.distance}-${index}`} className={index === selectedRoute ? "route-option active" : "route-option"} onClick={() => setSelectedRoute(index)}><span>{index === 0 ? <CheckCircle2 size={15} /> : <Navigation size={15} />}{index === 0 ? "Recommended" : `Alternative ${index}`}</span><b>{formatDuration(candidate.duration)}</b><small>{candidate.hazards.length ? `${candidate.hazards.length} hazard${candidate.hazards.length > 1 ? "s" : ""}` : "No major hazards detected"}</small></button>)}
          </div>
          <button className="btn-primary route-start" onClick={() => onNavigate("home")}><Navigation size={17} /> Start route</button>
        </>}
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
