import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle, Navigation, LocateFixed } from "lucide-react";
import TopBar from "../components/TopBar";
import { confirmedHazards, severityColors } from "../sampleData";
import { getLocalReports } from "../firebase";
import { getCurrentLocation, distanceKm } from "../utils/geo";

const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };
const LOCATION_INTERVAL = 3500;
const MOVE_THRESHOLD_KM = 0.015;

const selectedPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#6d28d9;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom(), { animate: true, duration: 0.35 });
  }, [center?.lat, center?.lng, zoom, map]);
  return null;
}

function OpenDirections({ destination }) {
  const openDirections = () => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return <button className="map-action-btn" onClick={openDirections}><Navigation size={15} /> Directions</button>;
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
        const next = await getCurrentLocation();
        const previous = lastLocationRef.current;
        // Ignore GPS jitter. React only re-renders when the user moved enough.
        if (!previous || distanceKm(previous.lat, previous.lng, next.lat, next.lng) >= MOVE_THRESHOLD_KM) {
          lastLocationRef.current = next;
          if (!cancelled) {
            setUserLocation(next);
            setLocationError(false);
          }
        }
      } catch {
        if (!cancelled && !lastLocationRef.current) setLocationError(true);
      } finally {
        requestInFlightRef.current = false;
      }
    };

    pollLocation();
    timerRef.current = window.setInterval(pollLocation, LOCATION_INTERVAL);

    const resume = () => pollLocation();
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelled = true;
      window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  const mapCenter = selectedLocation?.coordinates || userLocation || DEFAULT_CENTER;
  const origin = userLocation || DEFAULT_CENTER;
  const allNearbyCandidates = [...confirmedHazards, ...getLocalReports()].filter((h) => h.coordinates?.lat);
  const nearestAlert = allNearbyCandidates.map((h) => ({
    ...h,
    distance: distanceKm(origin.lat, origin.lng, h.coordinates.lat, h.coordinates.lng),
  })).sort((a, b) => a.distance - b.distance)[0] || confirmedHazards[0];

  const locateNow = async () => {
    setLocating(true);
    try {
      const next = await getCurrentLocation();
      lastLocationRef.current = next;
      setUserLocation(next);
      setLocationError(false);
    } catch {
      setLocationError(true);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="screen">
      <TopBar variant="home" title="RoadSense" theme={theme} onToggleTheme={onToggleTheme} />
      <div className="search-input" onClick={() => onNavigate("search")}>
        {selectedLocation ? selectedLocation.name : "Search here"}
      </div>

      <div className="map-wrapper">
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} zoomControl={true} preferCanvas style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={mapCenter} zoom={selectedLocation ? 15 : 13} />

          {userLocation && !selectedLocation && (
            <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={7} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}>
              <Popup>You are here{userLocation.accuracy ? ` · ±${Math.round(userLocation.accuracy)}m` : ""}</Popup>
            </CircleMarker>
          )}

          {selectedLocation && <Marker position={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]} icon={selectedPinIcon}><Popup>{selectedLocation.name}</Popup></Marker>}

          {confirmedHazards.map((hazard) => (
            <CircleMarker key={hazard.id} center={[hazard.coordinates.lat, hazard.coordinates.lng]} radius={8} pathOptions={{ color: severityColors[hazard.severity], fillColor: severityColors[hazard.severity], fillOpacity: 0.6 }}>
              <Popup>{hazard.name} — {hazard.severityLabel} ({hazard.type})</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <div className="map-actions">
          <button className="map-action-btn" onClick={locateNow} disabled={locating} title="Use my location">
            <LocateFixed size={15} className={locating ? "spin" : ""} /> {locating ? "Locating…" : "My location"}
          </button>
          {selectedLocation && <OpenDirections destination={selectedLocation.coordinates} />}
        </div>
      </div>

      {locationError && <p className="location-error">Location access nahi mila — Jaipur default view dikha rahe hain.</p>}

      <div className="alert-banner">
        <div className="alert-banner-title"><AlertTriangle size={14} /> {nearestAlert.hazardType || nearestAlert.type || nearestAlert.name} detected nearby</div>
        <div className="alert-banner-meta">{nearestAlert.distance !== undefined ? `${(nearestAlert.distance * 1000).toFixed(0)} m ahead` : "300 m ahead"}</div>
        <button onClick={() => onNavigate("alerts")}>View Alert</button>
      </div>
      <button className="btn-primary" onClick={() => onNavigate("report")}>+ Report a Hazard</button>
    </div>
  );
}
