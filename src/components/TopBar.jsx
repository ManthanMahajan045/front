import { ArrowLeft, Bell, Menu } from "lucide-react";

/**
 * variant "home"  -> hamburger + title + bell (Home, Profile)
 * variant "back"  -> back arrow + title (Search, Report a Hazard, Alerts, Reports)
 */
export default function TopBar({ variant = "home", title, onBack }) {
  if (variant === "back") {
    return (
      <div className="top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1>{title}</h1>
        <span style={{ width: 20 }} />
      </div>
    );
  }

  return (
    <div className="top-bar">
      <button className="icon-btn" aria-label="Menu">
        <Menu size={20} />
      </button>
      <h1>{title}</h1>
      <button className="icon-btn" aria-label="Notifications">
        <Bell size={20} />
      </button>
    </div>
  );
}
