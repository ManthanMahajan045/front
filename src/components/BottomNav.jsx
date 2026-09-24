import { Home, Navigation, Bell, MapPin, User } from "lucide-react";

const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "directions", label: "Navigate", icon: Navigation },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "report", label: "Report", icon: MapPin },
  { key: "profile", label: "Profile", icon: User },
];

export default function BottomNav({ active, onNavigate, alertCount = 0 }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button key={key} className={active === key ? "active" : ""} onClick={() => onNavigate(key)} aria-current={active === key ? "page" : undefined}>
          <span className="nav-icon-wrap">
            <Icon size={21} strokeWidth={active === key ? 2.4 : 1.8} />
            {key === "alerts" && alertCount > 0 && <span className="nav-badge">{alertCount > 9 ? "9+" : alertCount}</span>}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
