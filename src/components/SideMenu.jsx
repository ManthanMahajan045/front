import { Bell, ChevronRight, Globe2, HelpCircle, ShieldCheck, X } from "lucide-react";

const ITEMS = [
  { key: "alerts", label: "Alert Preferences", icon: Bell },
  { key: "trusted", label: "Trusted contacts / Emergency Sharing", icon: ShieldCheck },
  { key: "help", label: "How RoadSense works", icon: HelpCircle },
];

export default function SideMenu({ onClose, onNavigate }) {
  return (
    <div className="menu-backdrop" onClick={onClose}>
      <aside className="side-menu" onClick={(event) => event.stopPropagation()}>
        <div className="side-menu-head">
          <div>
            <strong>RoadSense</strong>
            <span>Smart roads, safer journeys.</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="side-menu-list">
          {ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} className="side-menu-row" onClick={() => key === "alerts" ? onNavigate("alerts") : undefined}>
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
          <button className="side-menu-row">
            <Globe2 size={18} />
            <span>Language</span>
            <em>English</em>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}
