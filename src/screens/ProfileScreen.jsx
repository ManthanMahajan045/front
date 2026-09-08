import { ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

// Replace with real user + aggregate report stats once auth/Firestore queries are wired in
const USER = { name: "NAME", reported: 12, verified: 8, resolved: 3 };

const SETTINGS_ROWS = [
  { key: "saved", label: "Saved Location" },
  { key: "notifications", label: "Notification Settings" },
  { key: "help", label: "Help & Support" },
  { key: "about", label: "About RoadSense" },
];

export default function ProfileScreen({ onNavigate }) {
  return (
    <div className="screen">
      <TopBar variant="home" title="RoadSense" />

      <div className="avatar" />
      <div className="profile-name">{USER.name}</div>
      <div className="profile-subtitle">RoadSense Member</div>

      <div className="section-label" style={{ margin: "16px 20px 6px" }}>
        My Reports
      </div>
      <div className="stats-row">
        <div className="stat">
          <div className="stat-value">{USER.reported}</div>
          <div className="stat-label">Reported</div>
        </div>
        <div className="stat">
          <div className="stat-value">{USER.verified}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat">
          <div className="stat-value">{USER.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {SETTINGS_ROWS.map((row) => (
        <button className="list-row" key={row.key}>
          {row.label}
          <ChevronRight size={16} className="chevron" />
        </button>
      ))}
      <button className="list-row danger">Logout</button>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}
