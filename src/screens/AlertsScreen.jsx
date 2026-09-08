import { useState, useEffect } from "react";
import { LocateFixed } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { getLocalReports } from "../firebase";
import { distanceKm } from "../utils/geo";

const ALERT_RADIUS_KM = 5; // "nearby" threshold — tune as needed

export default function AlertsScreen({ onNavigate }) {
  const [tab, setTab] = useState("active");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | granted | denied
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);

  function checkNearbyHazards() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus("granted");

        const allHazards = [
          ...confirmedHazards.map((h) => ({
            id: h.id,
            title: h.name,
            severity: h.severityLabel,
            coords: h.coordinates,
          })),
          ...getLocalReports().map((r) => ({
            id: r.id,
            title: r.hazardType,
            severity: r.status === "verified" ? "Verified" : "Pending",
            location: r.location,
            coords: r.coordinates,
          })),
        ].filter((h) => h.coords?.lat && h.coords?.lng);

        const nearby = allHazards
          .map((h) => ({
            ...h,
            distance: distanceKm(latitude, longitude, h.coords.lat, h.coords.lng),
          }))
          .filter((h) => h.distance <= ALERT_RADIUS_KM)
          .sort((a, b) => a.distance - b.distance);

        setActiveAlerts(nearby);
        setHistory(allHazards.filter((h) => !nearby.find((n) => n.id === h.id)));
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    checkNearbyHazards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listToShow = tab === "active" ? activeAlerts : history;

  return (
    <div className="screen">
      <TopBar variant="back" title="Alerts" onBack={() => onNavigate("home")} />

      <div className="tabs">
        <button
          className={`tab ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {locationStatus === "loading" && (
        <p style={{ padding: "20px", fontSize: 13, color: "#6b7280" }}>
          Location check ho rahi hai...
        </p>
      )}

      {locationStatus === "denied" && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
            Location permission nahi mili — nearby hazards check nahi ho sakte.
          </p>
          <button
            onClick={checkNearbyHazards}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "#6d28d9",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <LocateFixed size={14} /> Try again
          </button>
        </div>
      )}

      {locationStatus === "granted" && listToShow.length === 0 && (
        <p style={{ padding: "20px", fontSize: 13, color: "#6b7280" }}>
          {tab === "active"
            ? `Koi hazard ${ALERT_RADIUS_KM} km ke andar nahi mila.`
            : "History khaali hai."}
        </p>
      )}

      {listToShow.map((alert) => (
        <div className="card" key={alert.id}>
          <div className="card-title">{alert.title}</div>
          <div className="card-meta">
            {alert.location ? `${alert.location} · ` : ""}
            {alert.distance !== undefined
              ? `${alert.distance.toFixed(1)} km away`
              : ""}
            {alert.severity ? ` · ${alert.severity}` : ""}
          </div>
        </div>
      ))}

      <BottomNav active="alerts" onNavigate={onNavigate} />
    </div>
  );
}
