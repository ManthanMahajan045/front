import { ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const USER = { name: "NAME", reported: 12, verified: 8, resolved: 3 };

const SETTINGS_ROWS = [
  { key: "saved", label: "Saved Location" },
  { key: "notifications", label: "Notification Settings", target: "alerts" },
  { key: "help", label: "Help & Support" },
  { key: "about", label: "About RoadSense" },
];

export default function ProfileScreen({ onNavigate, onMenu }) {
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
          <button className="list-row" key={row.key} onClick={() => row.target && onNavigate(row.target)}>
            <span>{row.label}</span><ChevronRight size={16} className="chevron" />
          </button>
        ))}
      </div>
      <button className="list-row danger">Logout</button>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}
