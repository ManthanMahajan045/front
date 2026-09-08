import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { AlertTriangle } from "lucide-react";
import TopBar from "../components/TopBar";
import { confirmedHazards, severityColors } from "../sampleData";
import { getLocalReports } from "../firebase";
import { getCurrentLocation, distanceKm } from "../utils/geo";

// Jaipur fallback — used only if the browser denies/lacks location access
const DEFAULT_CENTER = { lat: 26.9124, lng: 75.7873 };

// Purple pin icon for a searched/selected location (distinct from hazard dots)
const selectedPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#6d28d9;
    transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

// Recenters/zooms the map whenever `center` changes — react-leaflet doesn't
// do this automatically once the map has already mounted.
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng]);
  return null;
}

export default function HomeScreen({ onNavigate, selectedLocation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    getCurrentLocation()
      .then(setUserLocation)
      .catch(() => setLocationError(true));
  }, []);

  const mapCenter = selectedLocation?.coordinates || userLocation || DEFAULT_CENTER;

  // Nearest hazard from wherever we currently know the user to be —
  // falls back to the first confirmed hazard if location isn't available yet.
  const origin = userLocation || DEFAULT_CENTER;
  const allNearbyCandidates = [...confirmedHazards, ...getLocalReports()].filter(
    (h) => h.coordinates?.lat
  );
  const nearestAlert =
    allNearbyCandidates
      .map((h) => ({ ...h, distance: distanceKm(origin.lat, origin.lng, h.coordinates.lat, h.coordinates.lng) }))
      .sort((a, b) => a.distance - b.distance)[0] || confirmedHazards[0];

  return (
    <div className="screen">
      <TopBar variant="home" title="RoadSense" />

      <div className="search-input" onClick={() => onNavigate("search")}>
        {selectedLocation ? selectedLocation.name : "Search here"}
      </div>

      <div className="placeholder-block" style={{ height: 260, margin: "16px 20px" }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: 10 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={mapCenter} zoom={selectedLocation ? 15 : 13} />

          {/* User's live location — blue dot, like Google Maps */}
          {userLocation && !selectedLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={7}
              pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>You are here</Popup>
            </CircleMarker>
          )}

          {/* Searched/selected location — purple pin */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.coordinates.lat, selectedLocation.coordinates.lng]}
              icon={selectedPinIcon}
            >
              <Popup>{selectedLocation.name}</Popup>
            </Marker>
          )}

          {confirmedHazards.map((hazard) => (
            <CircleMarker
              key={hazard.id}
              center={[hazard.coordinates.lat, hazard.coordinates.lng]}
              radius={8}
              pathOptions={{
                color: severityColors[hazard.severity],
                fillColor: severityColors[hazard.severity],
                fillOpacity: 0.6,
              }}
            >
              <Popup>
                {hazard.name} — {hazard.severityLabel} ({hazard.type})
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {locationError && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 20px 8px" }}>
          Location access nahi mila — Jaipur default view dikha rahe hain.
        </p>
      )}

      <div className="alert-banner">
        <div className="alert-banner-title">
          <AlertTriangle size={14} />
          {nearestAlert.hazardType || nearestAlert.type || nearestAlert.name} detected nearby
        </div>
        <div className="alert-banner-meta">
          {nearestAlert.distance !== undefined
            ? `${(nearestAlert.distance * 1000).toFixed(0)} m ahead`
            : "300 m ahead"}
        </div>
        <button onClick={() => onNavigate("alerts")}>View Alert</button>
      </div>

      <button className="btn-primary" onClick={() => onNavigate("report")}>
        + Report a Hazard
      </button>
    </div>
  );
}
