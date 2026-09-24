import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, MapPin, ThumbsUp, X } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getMyReports, getReports, auth } from "../firebase";
import { signOut } from "firebase/auth";

const SETTINGS_ROWS = [{ key: "saved", label: "Saved Location", target: "saved" }, { key: "notifications", label: "Notification Settings", target: "alerts" }, { key: "help", label: "Help & Support" }, { key: "about", label: "About RoadSense" }];
const MODALS = { saved: { title: "Saved Location", text: "Your saved locations will appear here. You can use the map and location tools to choose a place." }, help: { title: "Help & Support", text: "Use RoadSense to report hazards, view reports and receive nearby safety alerts. If a button does not respond, close this window and try again." }, about: { title: "About RoadSense", text: "RoadSense is a real-time road hazard alert system designed to help communities report hazards and travel more safely." } };
const STATUS_LABELS = { pending: "Pending", verified: "Verified", resolved: "Resolved" };

function formatDate(timestamp) {
  const date = timestamp?.toDate?.() || (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : null);
  if (!date) return "Just now";
  return date.toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function titleCase(value = "") {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ReportCard({ report }) {
  const status = report.status || "pending";
  return <article className="my-report-card">
    <div className="my-report-card-top">
      <div className="my-report-icon"><MapPin size={18} /></div>
      <div className="my-report-title-wrap">
        <strong>{titleCase(report.hazardType || "Road Hazard")}</strong>
        <span className={`my-report-status status-${status}`}>{STATUS_LABELS[status] || titleCase(status)}</span>
      </div>
    </div>
    {report.photoData && <img className="my-report-photo" src={report.photoData} alt="" />}
    <div className="my-report-location"><MapPin size={14} /><span>{report.location || "Location unavailable"}</span></div>
    <div className="my-report-meta">
      <span><CalendarDays size={13} /> {formatDate(report.createdAt)}</span>
      <span><ThumbsUp size={13} /> {report.upvotes || 0} upvotes</span>
    </div>
  </article>;
}

export default function ProfileScreen({ onNavigate, onMenu, user }) {
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(user || {});
  const [activeReportTab, setActiveReportTab] = useState("mine");
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.firebaseUid) { setReportsLoading(false); return; }
      setProfile(user);
      setReportsLoading(true);
      setReportsError("");
      try {
        const [mine, all] = await Promise.all([getMyReports(user.firebaseUid), getReports()]);
        if (!active) return;
        setMyReports(mine);
        setCommunityReports(all.filter((report) => report.status === "verified"));
      } catch (error) {
        if (active) setReportsError("Reports could not be loaded. Please try again.");
        console.warn("Reports unavailable:", error?.message || error);
      } finally {
        if (active) setReportsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  const name = profile.name || user?.name || "RoadSense user";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "RS";
  const openSetting = (row) => row.target ? onNavigate(row.target) : setModal(row.key);
  const visibleReports = activeReportTab === "mine" ? myReports : communityReports;

  return <div className="screen profile-screen">
    <TopBar variant="home" title="RoadSense" onMenu={onMenu} onNavigate={onNavigate} />
    <div className="profile-hero"><div className="avatar"><span>{initials}</span></div><div><div className="profile-name">{name}</div><div className="profile-subtitle">RoadSense Member</div></div></div>

    <div className="section-label">Reports</div>
    <div className="reports-tabs">
      <button className={activeReportTab === "mine" ? "active" : ""} onClick={() => setActiveReportTab("mine")}>My Reports</button>
      <button className={activeReportTab === "community" ? "active" : ""} onClick={() => setActiveReportTab("community")}>Community Verified</button>
    </div>

    <div className="my-reports-list">
      {reportsLoading && <div className="my-reports-state">Loading reports…</div>}
      {!reportsLoading && reportsError && <div className="my-reports-state error">{reportsError}</div>}
      {!reportsLoading && !reportsError && visibleReports.length === 0 && <div className="my-reports-empty">
        <div className="my-reports-empty-icon"><MapPin size={22} /></div>
        <strong>{activeReportTab === "mine" ? "No reports yet" : "No community verified reports yet"}</strong>
        <span>{activeReportTab === "mine" ? "Hazards you report will appear here." : "Reports verified by the community will appear here."}</span>
        {activeReportTab === "mine" && <button onClick={() => onNavigate("report")}>Report a Hazard</button>}
      </div>}
      {!reportsLoading && !reportsError && visibleReports.map((report) => <ReportCard key={report.id} report={report} />)}
    </div>

    <div className="section-label">Settings</div>
    <div className="settings-list">{SETTINGS_ROWS.map((row) => <button className="list-row" key={row.key} onClick={() => openSetting(row)}><span>{row.label}</span><ChevronRight size={16} className="chevron" /></button>)}</div>
    <button className="list-row danger" onClick={() => setModal("logout")}>Logout</button>
    <BottomNav active="profile" onNavigate={onNavigate}/>

    {modal && <div className="profile-modal-backdrop" onClick={() => setModal(null)}><div className="profile-modal" onClick={(event) => event.stopPropagation()}>
      <button className="profile-modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={18}/></button>
      {modal !== "logout" ? <><h3>{MODALS[modal].title}</h3><p>{MODALS[modal].text}</p><button className="modal-primary" onClick={() => setModal(null)}>Done</button></> : <><h3>Logout</h3><p>Are you sure you want to log out?</p><div className="modal-actions"><button onClick={() => setModal(null)}>Cancel</button><button className="confirm-danger" onClick={async () => { try { await signOut(auth); } catch (error) { console.error("Firebase logout failed:", error); } finally { localStorage.removeItem("roadsense-auth"); sessionStorage.removeItem("roadsense-auth"); setModal(null); window.location.reload(); } }}>Logout</button></div></>}
    </div></div>}
  </div>;
}
