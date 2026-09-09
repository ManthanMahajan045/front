import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Navigation, LocateFixed, Volume2, X } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards, severityColors } from "../sampleData";
import { getLocalReports } from "../firebase";
import { getCurrentLocation, distanceKm } from "../utils/geo";

const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };
const LOCATION_INTERVAL = 5000;
const MOVE_THRESHOLD_KM = 0.003;
const HAZARD_ALERT_RADIUS_M = 50;
const HAZARD_CLOSE_RADIUS_M = 20;

const selectedPinIcon = L.divIcon({ className: "", html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#6d28d9;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });

function getHomeGreeting(hour) {
  if (hour >= 5 && hour < 11) return { title: "Good morning", message: "Start your day with a safer route" };
  if (hour >= 11 && hour < 14) return { title: "Good afternoon", message: "Stay alert and enjoy the road ahead" };
  if (hour >= 14 && hour < 17) return { title: "Hope your afternoon is going well", message: "Let RoadSense help you travel safer" };
  if (hour >= 17 && hour < 21) return { title: "Good evening", message: "Take the safer way home" };
  if (hour >= 21 || hour < 1) return { title: "Good night", message: "Stay sharp and get home safe" };
  return { title: "Late-night drive?", message: "Keep it steady and let RoadSense watch the road" };
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom(), { animate: true, duration: 0.35 }); }, [center?.lat, center?.lng, zoom, map]);
  return null;
}

function playSafetyTone(close = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(close ? 720 : 560, now);
    oscillator.frequency.exponentialRampToValueAtTime(close ? 900 : 680, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(close ? 0.055 : 0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
    oscillator.addEventListener("ended", () => context.close());
  } catch {}
}

function vibrateSafety(close = false) {
  if (navigator.vibrate) navigator.vibrate(close ? [90, 70, 90] : [70]);
}

export default function HomeScreen({ onNavigate, selectedLocation, theme, onToggleTheme, onNotifications, onMenu, user }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [nearbyHazard, setNearbyHazard] = useState(null);
  const lastLocationRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const timerRef = useRef(null);
  const alertedHazardsRef = useRef(new Map());
  const hazardsRef = useRef([]);

  useEffect(() => {
    hazardsRef.current = [...confirmedHazards, ...getLocalReports()].filter((h) => h.coordinates?.lat && h.coordinates?.lng);
  }, []);

  const checkSafetyRadius = (location) => {
    const nearest = hazardsRef.current.map((hazard) => ({ ...hazard, distanceM: distanceKm(location.lat, location.lng, hazard.coordinates.lat, hazard.coordinates.lng) * 1000 })).filter((hazard) => hazard.distanceM <= HAZARD_ALERT_RADIUS_M).sort((a, b) => a.distanceM - b.distanceM)[0];
    if (!nearest) { setNearbyHazard(null); return; }
    const close = nearest.distanceM <= HAZARD_CLOSE_RADIUS_M;
    const lastAlert = alertedHazardsRef.current.get(nearest.id) || 0;
    const cooldown = close ? 25000 : 45000;
    if (Date.now() - lastAlert >= cooldown) {
      alertedHazardsRef.current.set(nearest.id, Date.now());
      setNearbyHazard({ ...nearest, close });
      playSafetyTone(close);
      vibrateSafety(close);
    } else setNearbyHazard((current) => current?.id === nearest.id ? { ...nearest, close } : current);
  };

  useEffect(() => {
    let cancelled = false;
    const pollLocation = async () => {
      if (cancelled || requestInFlightRef.current || document.hidden) return;
      requestInFlightRef.current = true;
      try {
        const next = await getCurrentLocation({ timeout: 15000, targetAccuracy: 10 });
        const previous = lastLocationRef.current;
        if (!previous || next.accuracy < previous.accuracy || distanceKm(previous.lat, previous.lng, next.lat, next.lng) >= MOVE_THRESHOLD_KM) {
          lastLocationRef.current = next;
          if (!cancelled) { setUserLocation(next); setLocationError(false); checkSafetyRadius(next); }
        }
      } catch { if (!cancelled && !lastLocationRef.current) setLocationError(true); }
      finally { requestInFlightRef.current = false; }
    };
    pollLocation();
    timerRef.current = window.setInterval(pollLocation, LOCATION_INTERVAL);
    const resume = () => { if (!document.hidden) pollLocation(); };
    document.addEventListener("visibilitychange", resume);
    return () => { cancelled = true; window.clearInterval(timerRef.current); document.removeEventListener("visibilitychange", resume); };
  }, []);

  const mapCenter = selectedLocation?.coordinates || userLocation || DEFAULT_CENTER;
  const origin = userLocation || DEFAULT_CENTER;
  const allNearbyCandidates = [...confirmedHazards, ...getLocalReports()].filter((h) => h.coordinates?.lat && h.coordinates?.lng);
  const nearestAlert = allNearbyCandidates.map((h) => ({ ...h, distance: distanceKm(origin.lat, origin.lng, h.coordinates.lat, h.coordinates.lng) })).sort((a, b) => a.distance - b.distance)[0] || confirmedHazards[0];
  const greeting = getHomeGreeting(new Date().getHours());
  const firstName = user?.name?.trim()?.split(/\s+/)[0];

  const locateNow = async () => {
    setLocating(true);
    try { const next = await getCurrentLocation({ timeout: 20000, targetAccuracy: 8 }); lastLocationRef.current = next; setUserLocation(next); setLocationError(false); checkSafetyRadius(next); }
    catch { setLocationError(true); } finally { setLocating(false); }
  };

  return (
    <div className="screen home-screen">
      <TopBar variant="home" title="RoadSense" theme={theme} onToggleTheme={onToggleTheme} onNotifications={onNotifications} onMenu={onMenu} />
      <section className="welcome-card" aria-label="Welcome message">
        <div className="welcome-eyebrow">{greeting.title}{firstName ? `, ${firstName}` : ""}</div>
        <h1>{greeting.message}</h1>
        <p>RoadSense is here to help you spot hazards early and travel with confidence</p>
      </section>
      <div className="search-input" onClick={() => onNavigate("search")}>{selectedLocation ? selectedLocation.name : "Where are you heading?"}</div>
      <div className="map-wrapper">
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} zoomControl preferCanvas style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={mapCenter} zoom={selectedLocation ? 16 : 14} />
          {userLocation && !selectedLocation && <><Circle center={[userLocation.lat, userLocation.lng]} radius={Math.max(userLocation.accuracy || 10, 5)} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: .1, weight: 1 }} /><CircleMarker center={[userLocation.lat, userLocation.lng]} radius={7} pathOptions={{ color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}><Popup>You are here · accuracy ±{Math.round(userLocation.accuracy)}m</Popup></CircleMarker></>}
          {selectedLocation && <Marker position={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]} icon={selectedPinIcon}><Popup>{selectedLocation.name}</Popup></Marker>}
          {confirmedHazards.map((hazard) => <CircleMarker key={hazard.id} center={[hazard.coordinates.lat, hazard.coordinates.lng]} radius={8} pathOptions={{ color: severityColors[hazard.severity], fillColor: severityColors[hazard.severity], fillOpacity: .6 }}><Popup>{hazard.name} — {hazard.severityLabel} ({hazard.type})</Popup></CircleMarker>)}
        </MapContainer>
        <div className="map-actions"><button className="map-action-btn" onClick={locateNow} disabled={locating}><LocateFixed size={15} className={locating ? "spin" : ""} /> {locating ? "Locating…" : "My location"}</button>{selectedLocation && <button className="map-action-btn route-cta" onClick={() => onNavigate("directions")}><Navigation size={15} /> Safe directions</button>}</div>
      </div>
      {nearbyHazard && <div className={`driver-alert ${nearbyHazard.close ? "driver-alert-close" : ""}`} role="alert"><div className="driver-alert-icon"><AlertTriangle size={21} /></div><div className="driver-alert-copy"><strong>{nearbyHazard.close ? "Hazard very close" : "Hazard ahead"}</strong><span>{Math.max(1, Math.round(nearbyHazard.distanceM))} m · {nearbyHazard.hazardType || nearbyHazard.type || nearbyHazard.name}</span><small>{nearbyHazard.close ? "Slow down and stay alert" : "Drive carefully"}</small></div><div className="driver-alert-actions"><Volume2 size={15} /><button onClick={() => setNearbyHazard(null)} aria-label="Dismiss hazard alert"><X size={17} /></button></div></div>}
      {locationError && <p className="location-error">Location access nahi mila — browser location permission check karein.</p>}
      <div className="alert-banner"><div className="alert-banner-title"><AlertTriangle size={14} /> {nearestAlert.hazardType || nearestAlert.type || nearestAlert.name} detected nearby</div><div className="alert-banner-meta">{nearestAlert.distance !== undefined ? `${(nearestAlert.distance * 1000).toFixed(0)} m ahead` : "Nearby"}</div><button onClick={() => onNavigate("alerts")}>View Alert</button></div>
      <button className="btn-primary" onClick={() => onNavigate("report")}>+ Report a Hazard</button>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
