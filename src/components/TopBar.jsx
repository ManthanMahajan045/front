import { ArrowLeft, Bell, Menu, Moon, Sun } from "lucide-react";

export default function TopBar({ variant = "home", title, onBack, theme = "light", onToggleTheme, onNotifications, onMenu }) {
  const themeButton = onToggleTheme ? (
    <button className="icon-btn" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title="Toggle theme">
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  ) : <span style={{ width: 28 }} />;

  if (variant === "back") {
    return (
      <div className="top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Go back"><ArrowLeft size={20} /></button>
        <h1>{title}</h1>
        {themeButton}
      </div>
    );
  }

  return (
    <div className="top-bar">
      <button className="icon-btn" onClick={onMenu} aria-label="Open menu" title="Menu"><Menu size={20} /></button>
      <h1>{title}</h1>
      <div className="top-actions">
        {themeButton}
        <button className="icon-btn alert-top-btn" onClick={onNotifications} aria-label="Open safety alerts" title="Safety alerts"><Bell size={20} /></button>
      </div>
    </div>
  );
}
