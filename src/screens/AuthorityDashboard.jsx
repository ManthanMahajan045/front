import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Clock3, Filter, MapPin, ShieldCheck, Siren, UserRound, Wrench, ChevronRight, Radio, Zap } from "lucide-react";
import { MapContainer, Popup, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { confirmedHazards } from "../sampleData";
import { getLocalReports } from "../firebase";

const JAIPUR_CENTER = [26.9124, 75.7873];
const ACTION_KEY = "roadsense_authority_actions";
const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
const severityColor = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#16a34a" };
const SLA_HOURS = { critical: 4, high: 12, medium: 24, low: 48 };

function readActions() {
  try { return JSON.parse(localStorage.getItem(ACTION_KEY)) || {}; } catch { return {}; }
}

function ageHours(createdAt) {
  if (!createdAt) return 0;
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3600000);
}

function formatAge(createdAt) {
  const hours = Math.floor(ageHours(createdAt));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getDepartment(title = "") {
  const text = title.toLowerCase();
  if (text.includes("water") || text.includes("flood") || text.includes("drain")) return "Drainage / Water";
  if (text.includes("traffic") || text.includes("signal")) return "Traffic Engineering";
  if (text.includes("accident") || text.includes("collision")) return "Traffic Police";
  return "Road Maintenance";
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
  const [view, setView] = useState("actions");

  const reports = useMemo(() => getLocalReports().map((report) => {
    const saved = actions[report.id] || {};
    const title = report.hazardType || "Road hazard";
    const severity = saved.severity || (report.upvotes >= 3 ? "high" : "medium");
    return {
      ...report,
      id: report.id,
      title,
      severity,
      status: saved.status || (report.status === "verified" ? "assigned" : "new"),
      assignedTo: saved.assignedTo || getDepartment(title),
      createdAt: report.createdAt,
      age: formatAge(report.createdAt),
      ageInHours: ageHours(report.createdAt),
      source: "Citizen report",
    };
  }), [actions]);

  const incidents = useMemo(() => {
    const seeded = confirmedHazards.map((hazard) => ({
      id: `hazard_${hazard.id}`,
      title: hazard.type || "Verified hazard",
      location: hazard.location,
      coordinates: hazard.coordinates,
      severity: hazard.severity === "red" ? "critical" : hazard.severity === "orange" ? "high" : "medium",
      status: "verified",
      assignedTo: "Road Safety Cell",
      source: hazard.source || "Verified hazard",
      age: "Verified",
      ageInHours: 0,
    }));
    return [...reports, ...seeded];
  }, [reports]);

  const actionable = incidents.filter((item) => !["verified"].includes(item.status));
  const visible = incidents.filter((item) => filter === "all" || item.severity === filter || item.status === filter);
  const critical = incidents.filter((item) => item.severity === "critical" && item.status !== "verified").length;
  const open = actionable.filter((item) => item.status !== "resolved").length;
  const resolved = incidents.filter((item) => ["resolved", "verified"].includes(item.status)).length;
  const overdue = actionable.filter((item) => item.ageInHours >= SLA_HOURS[item.severity] && item.status !== "resolved").length;
  const selected = incidents.find((item) => item.id === selectedId) || visible[0];
  const mapPoints = visible.filter((item) => item.coordinates?.lat && item.coordinates?.lng).slice(0, 80);

  const updateAction = (id, patch) => {
    const next = { ...actions, [id]: { ...(actions[id] || {}), ...patch } };
    setActions(next);
    localStorage.setItem(ACTION_KEY, JSON.stringify(next));
  };

  const advance = (item) => {
    const nextStatus = { new: "assigned", assigned: "in_progress", in_progress: "resolved", resolved: "verified" }[item.status] || "assigned";
    updateAction(item.id, {
      status: nextStatus,
      assignedTo: item.assignedTo === "Unassigned" ? getDepartment(item.title) : item.assignedTo,
      updatedAt: new Date().toISOString(),
    });
  };

  const escalate = (item) => updateAction(item.id, { severity: "critical", escalated: true, status: item.status === "new" ? "assigned" : item.status, assignedTo: item.assignedTo === "Unassigned" ? getDepartment(item.title) : item.assignedTo });

  const actionLabel = (status) => ({ new: "Assign", assigned: "Start", in_progress: "Resolve", resolved: "Verify" }[status] || "Manage");
  const slaState = (item) => {
    if (item.status === "verified") return "Closed";
    const limit = SLA_HOURS[item.severity] || 24;
    if (item.ageInHours >= limit) return "Breached";
    if (item.ageInHours >= limit * 0.75) return "At risk";
    return "On track";
  };

  return (
    <div className="authority-screen">
      <header className="authority-header">
        <div className="authority-brand">
          <button className="icon-btn" onClick={onBack || (() => onNavigate("home"))} aria-label="Back to RoadSense"><ArrowLeft size={20} /></button>
          <div><strong>RoadSense Authority</strong><span>Road safety command centre</span></div>
        </div>
        <div className="authority-user"><ShieldCheck size={18} /><span>Officer mode</span></div>
      </header>

      <main className="authority-content">
        <section className="authority-hero">
          <div><p>Live operations</p><h1>Authority Action Center</h1><span>Prioritize risk, assign teams, track SLA and close road-safety incidents.</span></div>
          <div className="authority-date"><Radio size={12} /> Live · Jaipur</div>
        </section>

        <section className="authority-kpis">
          <div className="authority-kpi"><span className="kpi-icon red"><Siren size={17} /></span><strong>{critical}</strong><small>Critical actions</small></div>
          <div className="authority-kpi"><span className="kpi-icon orange"><Clock3 size={17} /></span><strong>{open}</strong><small>Open actions</small></div>
          <div className="authority-kpi"><span className="kpi-icon green"><CheckCircle2 size={17} /></span><strong>{resolved}</strong><small>Resolved / verified</small></div>
          <div className="authority-kpi"><span className="kpi-icon yellow"><AlertTriangle size={17} /></span><strong>{overdue}</strong><small>SLA breached</small></div>
        </section>

        <div className="authority-tabs">
          {[{ key: "actions", label: "Action Center", icon: Zap }, { key: "map", label: "Live Map", icon: MapPin }, { key: "analytics", label: "Analytics", icon: BarChart3 }].map(({ key, label, icon: Icon }) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><Icon size={15} />{label}</button>
          ))}
        </div>

        {view !== "analytics" && <section className="authority-grid">
          <div className="authority-panel authority-map-panel">
            <div className="authority-panel-head"><div><h2>{view === "map" ? "Live hazard command map" : "Hazard command map"}</h2><p>Citizen reports, verified hazards and risk hotspots</p></div><button className="authority-filter"><Filter size={15} /> Filters</button></div>
            <div className="authority-map">
              <MapContainer center={JAIPUR_CENTER} zoom={11} scrollWheelZoom={false} zoomControl={false}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapCenter points={mapPoints} />
                {mapPoints.map((item) => <CircleMarker key={item.id} center={[item.coordinates.lat, item.coordinates.lng]} radius={item.severity === "critical" ? 9 : 7} pathOptions={{ color: severityColor[item.severity] || "#6b7280", fillColor: severityColor[item.severity] || "#6b7280", fillOpacity: .82 }} eventHandlers={{ click: () => setSelectedId(item.id) }}><Popup><strong>{item.title}</strong><br />{item.location || "Citizen report"}<br /><small>{item.status} · {item.assignedTo}</small></Popup></CircleMarker>)}
              </MapContainer>
              <div className="map-legend"><span><i className="legend-dot critical" />Critical</span><span><i className="legend-dot high" />High</span><span><i className="legend-dot medium" />Medium</span></div>
            </div>
          </div>

          {view === "actions" && <div className="authority-panel priority-panel">
            <div className="authority-panel-head"><div><h2>Priority action queue</h2><p>{actionable.length} incidents in operational workflow</p></div><BarChart3 size={19} /></div>
            <div className="filter-pills">{["all", "critical", "high", "medium", "new", "assigned", "in_progress"].map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All" : value === "in_progress" ? "In progress" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
            <div className="authority-queue">
              {visible.slice().sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.ageInHours - a.ageInHours).slice(0, 8).map((item) => (
                <article key={item.id} className={`authority-incident ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                  <span className="incident-severity" style={{ background: severityColor[item.severity] || "#6b7280" }} />
                  <div className="incident-main"><strong>{item.title}</strong><span><MapPin size={12} />{item.location || "Citizen submitted report"}</span><small>{item.status} · {item.assignedTo} · {item.age || "recent"}</small><em className={`sla-chip ${slaState(item).toLowerCase().replace(" ", "-")}`}>{slaState(item)}</em></div>
                  <div className="incident-actions">{item.status !== "verified" && <button onClick={(event) => { event.stopPropagation(); advance(item); }}>{actionLabel(item.status)}</button>}{item.status !== "verified" && item.severity !== "critical" && <button className="escalate-btn" onClick={(event) => { event.stopPropagation(); escalate(item); }}>Escalate</button>}</div>
                </article>
              ))}
              {!visible.length && <div className="authority-empty">No incidents match this filter.</div>}
            </div>
          </div>}

          {view === "map" && <div className="authority-panel">
            <div className="authority-panel-head"><div><h2>Selected incident</h2><p>Click any map marker to inspect and act</p></div><ChevronRight size={18} /></div>
            {selected ? <div className="authority-detail"><div className="detail-severity" style={{ color: severityColor[selected.severity] }}>{selected.severity.toUpperCase()}</div><h2>{selected.title}</h2><p>{selected.location || "Citizen submitted report"}</p><div className="detail-grid"><span>Status<strong>{selected.status}</strong></span><span>Owner<strong>{selected.assignedTo}</strong></span><span>Age<strong>{selected.age}</strong></span><span>SLA<strong>{slaState(selected)}</strong></span></div>{selected.status !== "verified" && <div className="detail-actions"><button onClick={() => advance(selected)}>{actionLabel(selected.status)}</button><button onClick={() => escalate(selected)}>Escalate</button></div>}</div> : <div className="authority-empty">Select a hazard marker.</div>}
          </div>}
        </section>}

        {view === "analytics" && <section className="authority-grid analytics-grid">
          <div className="authority-panel"><div className="authority-panel-head"><div><h2>Operational performance</h2><p>Derived from the current RoadSense action queue</p></div><BarChart3 size={18} /></div><div className="performance-grid"><div><strong>{incidents.length ? Math.round((resolved / incidents.length) * 100) : 0}%</strong><span>Resolved / verified</span></div><div><strong>{incidents.length ? Math.round((incidents.filter((i) => i.status !== "verified").reduce((sum, i) => sum + i.ageInHours, 0) / Math.max(1, actionable.length)) * 10) / 10 : 0}h</strong><span>Avg. open age</span></div><div><strong>{overdue}</strong><span>SLA breaches</span></div><div><strong>{new Set(incidents.map((i) => i.assignedTo)).size}</strong><span>Active owners</span></div></div></div>
          <div className="authority-panel"><div className="authority-panel-head"><div><h2>Department workload</h2><p>Current assignment distribution</p></div><Wrench size={18} /></div><div className="workload-list">{["Road Maintenance", "Traffic Engineering", "Drainage / Water", "Traffic Police"].map((dept) => { const count = incidents.filter((i) => i.assignedTo === dept && i.status !== "verified").length; return <div className="workload-row" key={dept}><div><strong>{dept}</strong><span>{count} active cases</span></div><div className="workload-track"><i style={{ width: `${Math.min(100, count * 18)}%` }} /></div></div>; })}</div></div>
        </section>}

        <section className="authority-panel authority-footer-panel"><div><strong>Workflow</strong><span>Receive → Prioritize → Assign → Act → Verify → Close</span></div><div className="authority-note"><UserRound size={15} /><span>Actions are currently persisted locally for the demo. Connect the same workflow to Firestore to synchronize assignments, SLA updates and resolution proof across authority accounts.</span></div></section>
      </main>
    </div>
  );
}
