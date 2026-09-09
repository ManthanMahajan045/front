import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Clock3, Filter, MapPin, ShieldCheck, Siren, UserRound, Wrench } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { confirmedHazards } from "../sampleData";
import { getLocalReports } from "../firebase";

const JAIPUR_CENTER = [26.9124, 75.7873];
const ACTION_KEY = "roadsense_authority_actions";

const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
const severityColor = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#16a34a" };

function readActions() {
  try { return JSON.parse(localStorage.getItem(ACTION_KEY)) || {}; } catch { return {}; }
}

function formatAge(createdAt) {
  const time = new Date(createdAt || Date.now()).getTime();
  const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function MapCenter({ points }) {
  const map = useMap();
  if (points.length) {
    const bounds = L.latLngBounds(points.map((point) => [point.coordinates.lat, point.coordinates.lng]));
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.18), { animate: false });
  }
  return null;
}

export default function AuthorityDashboard({ onBack, onNavigate }) {
  const [actions, setActions] = useState(readActions);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const reports = useMemo(() => {
    const local = getLocalReports();
    return local.map((report) => ({
      ...report,
      id: report.id,
      title: report.hazardType || "Road hazard",
      severity: actions[report.id]?.severity || (report.upvotes >= 3 ? "high" : "medium"),
      status: actions[report.id]?.status || (report.status === "verified" ? "assigned" : "new"),
      assignedTo: actions[report.id]?.assignedTo || "Unassigned",
    }));
  }, [actions]);

  const incidents = useMemo(() => {
    const seeded = confirmedHazards.map((hazard) => ({
      id: `hazard_${hazard.id}`,
      title: hazard.type || "Verified hazard",
      location: hazard.location,
      coordinates: hazard.coordinates,
      severity: hazard.severity === "red" ? "critical" : hazard.severity === "orange" ? "high" : "medium",
      status: "verified",
      assignedTo: "Road Safety Cell",
      source: hazard.source,
      age: "Verified",
    }));
    return [...reports, ...seeded];
  }, [reports]);

  const visible = incidents.filter((item) => filter === "all" || item.severity === filter || item.status === filter);
  const critical = incidents.filter((item) => item.severity === "critical").length;
  const open = incidents.filter((item) => !["resolved", "verified"].includes(item.status)).length;
  const resolved = incidents.filter((item) => item.status === "resolved").length;
  const overdue = incidents.filter((item) => !["resolved", "verified"].includes(item.status) && item.age && item.age !== "Verified" && Number.parseInt(item.age) >= 24).length;

  const updateAction = (id, patch) => {
    const next = { ...actions, [id]: { ...(actions[id] || {}), ...patch } };
    setActions(next);
    localStorage.setItem(ACTION_KEY, JSON.stringify(next));
  };

  const assign = (item) => updateAction(item.id, { assignedTo: "Road Maintenance", status: "assigned", severity: item.severity === "medium" ? "high" : item.severity });
  const resolve = (item) => updateAction(item.id, { assignedTo: item.assignedTo === "Unassigned" ? "Road Maintenance" : item.assignedTo, status: "resolved" });

  const mapPoints = visible.filter((item) => item.coordinates?.lat && item.coordinates?.lng).slice(0, 80);

  return (
    <div className="authority-screen">
      <header className="authority-header">
        <div className="authority-brand">
          <button className="icon-btn" onClick={onBack || (() => onNavigate("home"))} aria-label="Back to RoadSense"><ArrowLeft size={20} /></button>
          <div>
            <strong>RoadSense Authority</strong>
            <span>Road safety command centre</span>
          </div>
        </div>
        <div className="authority-user"><ShieldCheck size={18} /><span>Officer mode</span></div>
      </header>

      <main className="authority-content">
        <section className="authority-hero">
          <div><p>Good morning, Authority Team</p><h1>Road safety overview</h1><span>Monitor hazards, assign work and close incidents from one place.</span></div>
          <div className="authority-date">Live · Jaipur</div>
        </section>

        <section className="authority-kpis">
          <div className="authority-kpi"><span className="kpi-icon red"><Siren size={17} /></span><strong>{critical}</strong><small>Critical hazards</small></div>
          <div className="authority-kpi"><span className="kpi-icon orange"><Clock3 size={17} /></span><strong>{open}</strong><small>Open actions</small></div>
          <div className="authority-kpi"><span className="kpi-icon green"><CheckCircle2 size={17} /></span><strong>{resolved}</strong><small>Resolved</small></div>
          <div className="authority-kpi"><span className="kpi-icon yellow"><AlertTriangle size={17} /></span><strong>{overdue}</strong><small>SLA &gt; 24h</small></div>
        </section>

        <section className="authority-grid">
          <div className="authority-panel authority-map-panel">
            <div className="authority-panel-head"><div><h2>Hazard command map</h2><p>Verified black spots and citizen reports</p></div><button className="authority-filter"><Filter size={15} /> Filters</button></div>
            <div className="authority-map">
              <MapContainer center={JAIPUR_CENTER} zoom={11} scrollWheelZoom={false} zoomControl={false}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapCenter points={mapPoints} />
                {mapPoints.map((item) => <CircleMarker key={item.id} center={[item.coordinates.lat, item.coordinates.lng]} radius={item.severity === "critical" ? 9 : 7} pathOptions={{ color: severityColor[item.severity] || "#6b7280", fillColor: severityColor[item.severity] || "#6b7280", fillOpacity: .82 }} eventHandlers={{ click: () => setSelectedId(item.id) }}><Popup><strong>{item.title}</strong><br />{item.location || "Citizen report"}<br /><small>{item.status} · {item.assignedTo}</small></Popup></CircleMarker>)}
              </MapContainer>
              <div className="map-legend"><span><i className="legend-dot critical" />Critical</span><span><i className="legend-dot high" />High</span><span><i className="legend-dot medium" />Medium</span></div>
            </div>
          </div>

          <div className="authority-panel priority-panel">
            <div className="authority-panel-head"><div><h2>Priority action queue</h2><p>{incidents.length} incidents requiring attention</p></div><BarChart3 size={19} /></div>
            <div className="filter-pills">{["all", "critical", "high", "medium", "new", "assigned"].map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
            <div className="authority-queue">
              {visible.slice().sort((a, b) => severityRank[b.severity] - severityRank[a.severity]).slice(0, 7).map((item) => (
                <article key={item.id} className={`authority-incident ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                  <span className="incident-severity" style={{ background: severityColor[item.severity] || "#6b7280" }} />
                  <div className="incident-main"><strong>{item.title}</strong><span><MapPin size={12} />{item.location || "Citizen submitted report"}</span><small>{item.status} · {item.assignedTo} · {item.age || "recent"}</small></div>
                  <div className="incident-actions">{item.status !== "resolved" && item.status !== "verified" && <button onClick={(event) => { event.stopPropagation(); item.status === "new" ? assign(item) : resolve(item); }}>{item.status === "new" ? "Assign" : "Resolve"}</button>}</div>
                </article>
              ))}
              {!visible.length && <div className="authority-empty">No incidents match this filter.</div>}
            </div>
          </div>
        </section>

        <section className="authority-grid lower">
          <div className="authority-panel">
            <div className="authority-panel-head"><div><h2>Department workload</h2><p>Current assignment distribution</p></div><Wrench size={18} /></div>
            <div className="workload-list">
              {[{ name: "Road Maintenance", value: 72 }, { name: "Traffic Engineering", value: 54 }, { name: "Drainage / Water", value: 38 }, { name: "Traffic Police", value: 24 }].map((dept) => <div className="workload-row" key={dept.name}><div><strong>{dept.name}</strong><span>{dept.value} active cases</span></div><div className="workload-track"><i style={{ width: `${Math.min(100, dept.value)}%` }} /></div></div>)}
            </div>
          </div>
          <div className="authority-panel">
            <div className="authority-panel-head"><div><h2>Safety performance</h2><p>Operational health indicators</p></div><BarChart3 size={18} /></div>
            <div className="performance-grid"><div><strong>78%</strong><span>Within SLA</span></div><div><strong>4.2h</strong><span>Avg. response</span></div><div><strong>91%</strong><span>Citizen follow-up</span></div><div><strong>24</strong><span>High-risk zones</span></div></div>
            <div className="authority-note"><UserRound size={15} /><span>Assigning an incident changes its local authority workflow. Connect Firestore to make assignments shared across officers.</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
