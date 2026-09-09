import { useState } from "react";
import { Bell, ChevronRight, Globe2, HelpCircle, FileText, Home, LogOut, ShieldCheck, LayoutDashboard, X } from "lucide-react";

const ITEMS = [
  { key: "home", label: "Home", icon: Home, navigate: "home" },
  { key: "report", label: "Report an Issue", icon: FileText, navigate: "report" },
  { key: "reports", label: "My Reports", icon: FileText, navigate: "reports" },
  { key: "alerts", label: "Alert Preferences", icon: Bell, navigate: "alerts" },
  { key: "authority", label: "Authority Dashboard", icon: LayoutDashboard, navigate: "authority" },
  { key: "trusted", label: "Trusted contacts / Emergency Sharing", icon: ShieldCheck },
  { key: "help", label: "How RoadSense works", icon: HelpCircle },
];

export default function SideMenu({ onClose, onNavigate, language = "en", onLanguageChange }) {
  const [modal, setModal] = useState(null);
  const handleItem = (item) => { if (item.navigate) onNavigate(item.navigate); else setModal(item.key); };
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
        <div className="side-menu-head">
          <button className="side-menu-brand" onClick={() => { onClose(); onNavigate("home"); }} aria-label="Go to RoadSense home">
            <img src="/roadsense-logo.svg" alt="" /><span><strong>RoadSense</strong><small>Smart roads. Safer journeys.</small></span>
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="side-menu-list">
          {ITEMS.map((item) => { const Icon = item.icon; return <button key={item.key} className={`side-menu-row ${item.key === "authority" ? "authority-menu-row" : ""}`} onClick={() => handleItem(item)}><Icon size={18} /><span>{item.label}</span><ChevronRight size={16} /></button>; })}
          <button className="side-menu-row" onClick={() => setModal("language")}><Globe2 size={18} /><span>Language</span><em>{language === "hi" ? "हिंदी" : "English"}</em><ChevronRight size={16} /></button>
          <button className="side-menu-row side-menu-danger" onClick={() => setModal("logout")}><LogOut size={18} /><span>Logout</span><span /></button>
        </div>
        <div className="side-menu-footer">Safer Roads. Smarter Communities.<br />RoadSense</div>
        {modal && <div className="menu-modal-backdrop" onClick={() => setModal(null)}><div className="menu-modal" onClick={(event) => event.stopPropagation()}><button className="menu-modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>{modal === "trusted" && <><h3>Trusted Contacts</h3><p>Add and manage people you trust for emergency sharing. This section is ready for contact integration.</p></>}{modal === "help" && <><h3>How RoadSense works</h3><p>RoadSense helps you discover nearby road hazards, report issues and receive safety alerts.</p></>}{modal === "language" && <><h3>Language</h3><button className="language-choice" onClick={() => { onLanguageChange?.("en"); setModal(null); }}> {language === "en" ? "✓ " : ""}English</button><button className="language-choice" onClick={() => { onLanguageChange?.("hi"); setModal(null); }}>{language === "hi" ? "✓ " : ""}Hindi</button></>}{modal === "logout" && <><h3>Logout</h3><p>Are you sure you want to log out?</p><div className="modal-actions"><button onClick={() => setModal(null)}>Cancel</button><button className="confirm-danger" onClick={handleLogout}>Logout</button></div></>}</div></div>}
      </aside>
    </div>
  );
}
