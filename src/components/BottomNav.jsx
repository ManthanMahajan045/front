import { Home, FileText, Bell, User } from "lucide-react";

const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={active === key ? "active" : ""}
          onClick={() => onNavigate(key)}
        >
          <Icon size={20} strokeWidth={active === key ? 2.4 : 1.8} />
          {label.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
