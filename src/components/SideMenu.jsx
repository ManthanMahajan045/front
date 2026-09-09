import { useState } from "react";
import { Bell, ChevronRight, Globe2, HelpCircle, FileText, Home, LogOut, ShieldCheck, LayoutDashboard, X, Bookmark, BookOpen, Info, MessageSquare, LockKeyhole, Route, AlertTriangle } from "lucide-react";

const ITEMS = [
  { key: "home", label: "Home", icon: Home, navigate: "home", hint: "Your road safety overview" },
  { key: "report", label: "Report a Hazard", icon: FileText, navigate: "report", hint: "Help other drivers" },
  { key: "reports", label: "My Reports", icon: FileText, navigate: "reports", hint: "Track what you reported" },
  { key: "alerts", label: "Alerts & Alert Sounds", icon: Bell, navigate: "alerts", hint: "Choose your warning tone" },
  { key: "saved", label: "Saved Places", icon: Bookmark, hint: "Home, work and favourites" },
  { key: "trusted", label: "Trusted Contacts", icon: ShieldCheck, hint: "Emergency sharing" },
  { key: "safety", label: "Road Safety Guide", icon: BookOpen, hint: "Practical driving tips" },
  { key: "how", label: "How RoadSense Works", icon: HelpCircle, hint: "Understand the full journey" },
  { key: "authority", label: "Authority Dashboard", icon: LayoutDashboard, navigate: "authority", hint: "For road authorities" },
  { key: "privacy", label: "Privacy & Permissions", icon: LockKeyhole, hint: "Location, notifications and data" },
  { key: "about", label: "About RoadSense", icon: Info, hint: "Our mission and features" },
  { key: "feedback", label: "Send Feedback", icon: MessageSquare, hint: "Help us improve" },
];

const MODAL_CONTENT = {
  saved: {
    title: "Saved Places",
    body: "Save places you visit often so navigation can feel faster and more personal. You can use labels such as Home, Work, College or Favourite. Saved places can later become quick destinations from the home screen.",
    bullets: ["Home and work shortcuts", "Favourite destinations", "Faster route planning", "Hazard-aware navigation to saved places"],
  },
  trusted: {
    title: "Trusted Contacts & Emergency Sharing",
    body: "RoadSense is designed to make difficult moments easier. Trusted contacts can be used for future emergency-sharing features such as sending your current location or a safety status when you need help.",
    bullets: ["Add people you trust", "Share your current location when needed", "Keep emergency sharing under your control", "No automatic sharing without your action"],
  },
  safety: {
    title: "Road Safety Guide",
    body: "RoadSense is more than a map. The safest response to a warning is usually to slow down, increase following distance and stay focused on the road. Never interact with the app while the vehicle is moving unless it can be done safely.",
    bullets: ["Slow down near potholes, waterlogging and road work", "Keep extra distance after an accident warning", "Use alerts as guidance, not as a substitute for road signs", "If conditions are dangerous, choose a safer route or stop safely"],
  },
  how: {
    title: "How RoadSense Works",
    body: "RoadSense combines your location, road information and community reports to help you understand what may be ahead. When you report a hazard, the app records its type, location and optional photo. Reports can be reviewed and community activity can help identify useful verified information.",
    bullets: ["1. Detect — understand where you are", "2. Discover — find nearby hazards and road conditions", "3. Warn — show a clear alert when something may affect your journey", "4. Report — let drivers contribute new hazards", "5. Verify — community and authority workflows improve confidence", "6. Navigate — choose routes with safety information in mind"],
  },
  privacy: {
    title: "Privacy & Permissions",
    body: "RoadSense asks for permissions only when a feature needs them. Location is used for nearby hazard checks and location-aware navigation. Notifications are used for safety warnings when you enable them. Photos are optional when reporting a hazard.",
    bullets: ["Location — used for positioning and nearby alerts", "Camera — used only when you choose to capture a hazard", "Photos — optional evidence attached to your report", "Notifications — optional safety alerts", "You can manage browser permissions from your device or browser settings"],
  },
  about: {
    title: "About RoadSense",
    body: "RoadSense is a community-focused road safety experience built around one simple idea: give people better information before a road hazard becomes a surprise. The app connects reporting, alerts, safer route planning and authority workflows in one place.",
    bullets: ["Community hazard reporting", "Nearby road safety alerts", "Hazard-aware route planning", "Photo-based reports", "Authority incident workflows", "Personal alert sound preferences", "Designed for safer, more informed journeys"],
  },
  feedback: {
    title: "Send Feedback",
    body: "Your feedback helps shape RoadSense. Tell us what felt confusing, which alert was useful, what should be faster, or what feature you would like next.",
    bullets: ["What worked well?", "What felt difficult?", "Did an alert make sense?", "Which road-safety feature should we improve next?"],
  },
};

export default function SideMenu({ onClose, onNavigate, language = "en", onLanguageChange }) {
  const [modal, setModal] = useState(null);
  const handleItem = (item) => { if (item.navigate) { onClose(); onNavigate(item.navigate); } else setModal(item.key); };
  const handleLogout = () => {
    localStorage.removeItem("roadsense-auth");
    sessionStorage.removeItem("roadsense-auth");
    setModal(null);
    onClose();
    window.location.reload();
  };

  return (
    <div className="menu-backdrop" onClick={onClose}>
      <aside className="side-menu" onClick={(event) => event.stopPropagation()}>
        <style>{`
          .side-menu .menu-section-title{padding:16px 4px 7px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8b5cf6}
          .side-menu .side-menu-row{min-height:58px}
          .side-menu .side-menu-row>span:nth-child(2){display:flex;flex-direction:column;gap:2px}
          .side-menu .side-menu-row small{font-size:9px;color:var(--muted);font-weight:400}
          .side-menu .side-menu-brand small{font-size:10px}
          .side-menu .menu-modal{max-height:82vh;overflow:auto}
          .side-menu .info-list{display:grid;gap:8px;margin-top:15px;padding:0;list-style:none}
          .side-menu .info-list li{font-size:11px;line-height:1.45;color:var(--text);padding:9px 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2)}
          .side-menu .info-list li::first-letter{color:#6d28d9}
          .side-menu .menu-modal-kicker{font-size:10px;color:#7c3aed;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
          .side-menu .menu-modal p{font-size:12px;line-height:1.55}
        `}</style>
        <div className="side-menu-head">
          <button className="side-menu-brand" onClick={() => { onClose(); onNavigate("home"); }} aria-label="Go to RoadSense home">
            <img src="/roadsense-logo.svg" alt="" /><span><strong>RoadSense</strong><small>See the road ahead, travel safer</small></span>
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>

        <div className="side-menu-list">
          <div className="menu-section-title">Your RoadSense</div>
          {ITEMS.slice(0, 8).map((item) => { const Icon = item.icon; return <button key={item.key} className="side-menu-row" onClick={() => handleItem(item)}><Icon size={18} /><span>{item.label}<small>{item.hint}</small></span><ChevronRight size={16} /></button>; })}
          <div className="menu-section-title">More</div>
          {ITEMS.slice(8).map((item) => { const Icon = item.icon; return <button key={item.key} className={`side-menu-row ${item.key === "authority" ? "authority-menu-row" : ""}`} onClick={() => handleItem(item)}><Icon size={18} /><span>{item.label}<small>{item.hint}</small></span><ChevronRight size={16} /></button>; })}
          <button className="side-menu-row" onClick={() => setModal("language")}><Globe2 size={18} /><span>Language<small>Choose your preferred language</small></span><em>{language === "hi" ? "हिंदी" : "English"}</em><ChevronRight size={16} /></button>
          <button className="side-menu-row side-menu-danger" onClick={() => setModal("logout")}><LogOut size={18} /><span>Logout<small>End this RoadSense session</small></span><span /></button>
        </div>

        <div className="side-menu-footer">RoadSense · See the road ahead, travel safer<br />Built to help communities notice hazards earlier and make safer journeys.</div>

        {modal && <div className="menu-modal-backdrop" onClick={() => setModal(null)}>
          <div className="menu-modal" onClick={(event) => event.stopPropagation()}>
            <button className="menu-modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
            {modal === "language" ? <><div className="menu-modal-kicker">Personalise RoadSense</div><h3>Language</h3><p>Choose how RoadSense labels and guidance should appear.</p><button className="language-choice" onClick={() => { onLanguageChange?.("en"); setModal(null); }}>{language === "en" ? "✓ " : ""}English</button><button className="language-choice" onClick={() => { onLanguageChange?.("hi"); setModal(null); }}>{language === "hi" ? "✓ " : ""}Hindi</button></> : modal === "logout" ? <><h3>Logout</h3><p>Are you sure you want to log out of RoadSense?</p><div className="modal-actions"><button onClick={() => setModal(null)}>Cancel</button><button className="confirm-danger" onClick={handleLogout}>Logout</button></div></> : <><div className="menu-modal-kicker"><Route size={12} /> RoadSense guide</div><h3>{MODAL_CONTENT[modal]?.title}</h3><p>{MODAL_CONTENT[modal]?.body}</p><ul className="info-list">{MODAL_CONTENT[modal]?.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><button className="modal-primary" onClick={() => setModal(null)}>Got it</button></>}
          </div>
        </div>}
      </aside>
    </div>
  );
}
