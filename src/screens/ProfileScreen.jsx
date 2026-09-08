import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const USER = { name: "NAME", reported: 12, verified: 8, resolved: 3 };

const SETTINGS_ROWS = [
  { key: "saved", label: "Saved Location" },
  { key: "notifications", label: "Notification Settings", target: "alerts" },
  { key: "help", label: "Help & Support" },
  { key: "about", label: "About RoadSense" },
];

const MODALS = {
  saved: { title: "Saved Location", text: "Your saved locations will appear here. You can use the map and location tools to choose a place." },
  help: { title: "Help & Support", text: "Use RoadSense to report hazards, view reports and receive nearby safety alerts. If a button does not respond, close this window and try again." },
  about: { title: "About RoadSense", text: "RoadSense is a real-time road hazard alert system designed to help communities report hazards and travel more safely." },
};

export default function ProfileScreen({ onNavigate, onMenu }) {
  const [modal, setModal] = useState(null);

  const openSetting = (row) => {
    if (row.target) onNavigate(row.target);
    else setModal(row.key);
  };

  return (
    <div className="screen profile-screen">
      <TopBar variant="home" title="RoadSense" onMenu={onMenu} />
      <div className="profile-hero">
        <div className="avatar"><span>NM</span></div>
        <div><div className="profile-name">{USER.name}</div><div className="profile-subtitle">RoadSense Member</div></div>
      </div>

      <div className="section-label">My Reports</div>
      <div className="stats-row">
        <div className="stat"><div className="stat-value">{USER.reported}</div><div className="stat-label">Reported</div></div>
        <div className="stat"><div className="stat-value">{USER.verified}</div><div className="stat-label">Verified</div></div>
        <div className="stat"><div className="stat-value">{USER.resolved}</div><div className="stat-label">Resolved</div></div>
      </div>

      <div className="section-label">Settings</div>
      <div className="settings-list">
        {SETTINGS_ROWS.map((row) => (
          <button className="list-row" key={row.key} onClick={() => openSetting(row)}>
            <span>{row.label}</span><ChevronRight size={16} className="chevron" />
          </button>
        ))}
      </div>
      <button className="list-row danger" onClick={() => setModal("logout")}>Logout</button>
      <BottomNav active="profile" onNavigate={onNavigate} />

      {modal && (
        <div className="profile-modal-backdrop" onClick={() => setModal(null)}>
          <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
            {modal !== "logout" ? (
              <><h3>{MODALS[modal].title}</h3><p>{MODALS[modal].text}</p><button className="modal-primary" onClick={() => setModal(null)}>Done</button></>
            ) : (
              <><h3>Logout</h3><p>Are you sure you want to log out?</p><div className="modal-actions"><button onClick={() => setModal(null)}>Cancel</button><button className="confirm-danger" onClick={() => { setModal(null); onNavigate("home"); }}>Logout</button></div></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
