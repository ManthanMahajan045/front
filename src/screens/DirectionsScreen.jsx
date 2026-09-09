import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { ArrowLeft, CheckCircle2, Clock3, Navigation, ShieldAlert, LocateFixed, Square } from "lucide-react";
import L from "leaflet";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { getHazardAwareRoutes } from "../utils/routing";
import { getCurrentLocation } from "../utils/geo";

const pin = L.divIcon({ className: "", html: "<div class=\"route-pin\"></div>", iconSize: [22, 22], iconAnchor: [11, 11] });
const livePin = L.divIcon({ className: "", html: "<div style=\"width:22px;height:22px;border-radius:50%;background:#6d28d9;border:3px solid #fff;box-shadow:0 0 0 7px rgba(109,40,217,.18),0 2px 10px rgba(0,0,0,.35);position:relative\"><span style=\"position:absolute;inset:4px;border-radius:50%;background:#fff\"></span></div>", iconSize: [28, 28], iconAnchor: [14, 14] });

function FitRoute({ route, origin, destination, follow }) {
  const map = useMap();
  useEffect(() => {
    const coords = route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
    if (follow && origin) map.setView([origin.lat, origin.lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.5 });
    else if (coords.length) map.fitBounds(coords, { padding: [30, 30] });
    else if (origin && destination) map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [40, 40] });
  }, [route, origin, destination, follow, map]);
  return null;
}
function formatDistance(meters) { return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`; }
function formatDuration(seconds) { const minutes = Math.max(1, Math.round(seconds / 60)); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`; }

export default function DirectionsScreen({ onNavigate, selectedLocation, userLocation }) {
  const [origin, setOrigin] = useState(userLocation || null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const latestGpsRef = useRef(null);
  const watchRef = useRef(null);
  const rerouteRef = useRef(null);

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
      } catch (err) { if (!cancelled) setError(err.message || "Could not build a route."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [destination]);

  useEffect(() => () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    if (rerouteRef.current) window.clearInterval(rerouteRef.current);
  }, []);

  const startLiveNavigation = () => {
    if (!navigator.geolocation) { setError("Live GPS is not supported by this browser."); return; }
    setIsNavigating(true); setError(""); setGpsStatus("Finding your live location…");
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition((position) => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, heading: position.coords.heading, speed: position.coords.speed, timestamp: position.timestamp };
      latestGpsRef.current = next; setOrigin(next); setGpsStatus(`Live • ±${Math.round(next.accuracy || 0)} m accuracy`);
    }, (gpsError) => { setGpsStatus(""); setError(gpsError.code === 1 ? "Location permission is required for live navigation." : "GPS signal is temporarily unavailable."); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 });
    if (rerouteRef.current) window.clearInterval(rerouteRef.current);
    rerouteRef.current = window.setInterval(async () => {
      const live = latestGpsRef.current; if (!live || !destination) return;
      try { const freshRoutes = await getHazardAwareRoutes(live, destination, confirmedHazards); setRoutes(freshRoutes); setSelectedRoute((current) => Math.min(current, Math.max(0, freshRoutes.length - 1))); }
      catch (err) { console.warn("Live reroute failed:", err); }
    }, 5000);
  };

  const stopLiveNavigation = () => {
    setIsNavigating(false); setGpsStatus("");
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    if (rerouteRef.current) window.clearInterval(rerouteRef.current);
    rerouteRef.current = null;
  };

  if (!destination) return <div className="screen"><div className="route-header"><button onClick={() => onNavigate("home")}><ArrowLeft size={20} /></button><strong>Directions</strong></div><div className="route-empty">Select a destination from Search to get an in-app route.</div><BottomNav active="home" onNavigate={onNavigate} /></div>;

  return <div className="screen directions-screen">
    <div className="route-header"><button onClick={() => { stopLiveNavigation(); onNavigate("home"); }} aria-label="Back"><ArrowLeft size={20} /></button><div><strong>{isNavigating ? "Live navigation" : "Safe route"}</strong><span>RoadSense navigation</span></div><Navigation size={20} /></div>
    <div className="route-map">
      {origin && <MapContainer center={[origin.lat, origin.lng]} zoom={14} zoomControl={false} style={{ height: "100%", width: "100%" }}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitRoute route={route} origin={origin} destination={destination} follow={isNavigating} />{routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: "#6d28d9", weight: 6, opacity: .9 }} />}<Marker position={[origin.lat, origin.lng]} icon={isNavigating ? livePin : pin} /><Marker position={[destination.lat, destination.lng]} icon={pin} /></MapContainer>}
      {loading && <div className="route-loading">Building safest route…</div>}
      {isNavigating && gpsStatus && <div style={{ position: "absolute", zIndex: 1000, top: 12, left: 12, right: 12, padding: "9px 12px", borderRadius: 12, background: "rgba(20,20,24,.92)", color: "#fff", fontSize: 12, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(0,0,0,.25)" }}><LocateFixed size={15} />{gpsStatus}</div>}
    </div>
    <div className="route-sheet"><div className="route-destination"><span>TO</span><strong>{selectedLocation.name}</strong><small>{selectedLocation.address}</small></div>{error && <div className="route-error"><ShieldAlert size={17} /> {error}</div>}{route && <><div className="route-summary"><div><Clock3 size={17} /><strong>{formatDuration(route.duration)}</strong><span>estimated</span></div><div><Navigation size={17} /><strong>{formatDistance(route.distance)}</strong><span>driving</span></div><div><ShieldAlert size={17} /><strong>{route.hazards.length ? route.hazards.length : "Clear"}</strong><span>hazards</span></div></div>{route.hazards.length > 0 && <div className="hazard-warning"><ShieldAlert size={18} /><div><strong>Hazards on this route</strong><p>{route.hazards.slice(0, 2).map((h) => h.name).join(" • ")}</p></div></div>}{!isNavigating && <div className="route-options">{routes.map((candidate, index) => <button key={`${candidate.distance}-${index}`} className={index === selectedRoute ? "route-option active" : "route-option"} onClick={() => setSelectedRoute(index)}><span>{index === 0 ? <CheckCircle2 size={15} /> : <Navigation size={15} />}{index === 0 ? "Recommended" : `Alternative ${index}`}</span><b>{formatDuration(candidate.duration)}</b><small>{candidate.hazards.length ? `${candidate.hazards.length} hazard${candidate.hazards.length > 1 ? "s" : ""}` : "No major hazards detected"}</small></button>)}</div>}<button className="btn-primary route-start" onClick={isNavigating ? stopLiveNavigation : startLiveNavigation}>{isNavigating ? <><Square size={16} /> End navigation</> : <><Navigation size={17} /> Start route</>}</button>{isNavigating && <div style={{ textAlign: "center", fontSize: 11, marginTop: 8, opacity: .7 }}>GPS location updates continuously • route refreshes every 5 seconds</div>}</>}</div>
    <BottomNav active="home" onNavigate={(page) => { if (isNavigating) stopLiveNavigation(); onNavigate(page); }} />
  </div>;
}
