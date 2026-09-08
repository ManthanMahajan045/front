import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Navigation, LocateFixed } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards, severityColors } from "../sampleData";
import { getLocalReports } from "../firebase";
import { getCurrentLocation, distanceKm } from "../utils/geo";

const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };
const LOCATION_INTERVAL = 5000;
const MOVE_THRESHOLD_KM = 0.003;

const selectedPinIcon = L.divIcon({ className: "", html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#6d28d9;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`, iconSize: [26, 26], iconAnchor: [13, 26] });

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom(), { animate: true, duration: 0.35 });
  }, [center?.lat, center?.lng, zoom, map]);
  return null;
}

export default function HomeScreen({ onNavigate, selectedLocation, theme, onToggleTheme }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);
  const lastLocationRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const timerRef = useRef(null);

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
          if (!cancelled) { setUserLocation(next); setLocationError(false); }
        }
      } catch {
        if (!cancelled && !lastLocationRef.current) setLocationError(true);
      } finally { requestInFlightRef.current = false; }
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

  const locateNow = async () => {
    setLocating(true);
    try {
      const next = await getCurrentLocation({ timeout: 20000, targetAccuracy: 8 });
      lastLocationRef.current = next; setUserLocation(next); setLocationError(false);
    } catch { setLocationError(true); } finally { setLocating(false); }
  };

  return (
    <div className="screen home-screen">
      <TopBar variant="home" title="RoadSense" theme={theme} onToggleTheme={onToggleTheme} />
      <div className="search-input" onClick={() => onNavigate("search")}>{selectedLocation ? selectedLocation.name : "Search destination"}</div>

      <div className="map-wrapper">
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} zoomControl preferCanvas style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={mapCenter} zoom={selectedLocation ? 16 : 14} />
          {userLocation && !selectedLocation && <><Circle center={[userLocation.lat, userLocation.lng]} radius={Math.max(userLocation.accuracy || 10, 5)} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: .1, weight: 1 }} /><CircleMarker center={[userLocation.lat, userLocation.lng]} radius={7} pathOptions={{ color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }}><Popup>You are here · accuracy ±{Math.round(userLocation.accuracy)}m</Popup></CircleMarker></>}
          {selectedLocation && <Marker position={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]} icon={selectedPinIcon}><Popup>{selectedLocation.name}</Popup></Marker>}
          {confirmedHazards.map((hazard) => <CircleMarker key={hazard.id} center={[hazard.coordinates.lat, hazard.coordinates.lng]} radius={8} pathOptions={{ color: severityColors[hazard.severity], fillColor: severityColors[hazard.severity], fillOpacity: .6 }}><Popup>{hazard.name} — {hazard.severityLabel} ({hazard.type})</Popup></CircleMarker>)}
        </MapContainer>
        <div className="map-actions">
          <button className="map-action-btn" onClick={locateNow} disabled={locating}><LocateFixed size={15} className={locating ? "spin" : ""} /> {locating ? "Locating…" : "My location"}</button>
          {selectedLocation && <button className="map-action-btn route-cta" onClick={() => onNavigate("directions")}><Navigation size={15} /> Safe directions</button>}
        </div>
      </div>

      {selectedLocation && <button className="route-preview" onClick={() => onNavigate("directions")}><div><span>SAFE ROUTE</span><strong>Get hazard-aware directions</strong></div><Navigation size={20} /></button>}
      {locationError && <p className="location-error">Location access nahi mila — browser location permission check karein.</p>}
      <div className="alert-banner"><div className="alert-banner-title"><AlertTriangle size={14} /> {nearestAlert.hazardType || nearestAlert.type || nearestAlert.name} detected nearby</div><div className="alert-banner-meta">{nearestAlert.distance !== undefined ? `${(nearestAlert.distance * 1000).toFixed(0)} m ahead` : "Nearby"}</div><button onClick={() => onNavigate("alerts")}>View Alert</button></div>
      <button className="btn-primary" onClick={() => onNavigate("report")}>+ Report a Hazard</button>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
