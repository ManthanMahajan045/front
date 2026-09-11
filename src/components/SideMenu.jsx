import { useState } from "react";
import { Bell, ChevronRight, Globe2, HelpCircle, FileText, Home, LogOut, ShieldCheck, LayoutDashboard, X, Bookmark, BookOpen, Info, MessageSquare, LockKeyhole, Route, Phone, Ambulance, Flame, ShieldAlert } from "lucide-react";
import { submitFeedback } from "../firebase";

const ITEMS = [
  { key: "home", label: "Home", icon: Home, navigate: "home", hint: "Your road safety overview" },
  { key: "report", label: "Report a Hazard", icon: FileText, navigate: "report", hint: "Help other drivers" },
  { key: "reports", label: "My Reports", icon: FileText, navigate: "reports", hint: "Track what you reported" },
  { key: "alerts", label: "Alerts & Alert Sounds", icon: Bell, navigate: "alerts", hint: "Choose your warning tone" },
  { key: "saved", label: "Saved Places", icon: Bookmark, navigate: "saved", hint: "Home, work and favourites" },
  { key: "trusted", label: "Trusted Contacts", icon: ShieldCheck, hint: "Emergency sharing" },
  { key: "safety", label: "Road Safety Guide", icon: BookOpen, hint: "Practical driving tips" },
  { key: "how", label: "How RoadSense Works", icon: HelpCircle, hint: "Understand the full journey" },
  { key: "authority", label: "Authority Dashboard", icon: LayoutDashboard, navigate: "authority", hint: "For road authorities" },
  { key: "privacy", label: "Privacy & Permissions", icon: LockKeyhole, hint: "Location, notifications and data" },
  { key: "about", label: "About RoadSense", icon: Info, hint: "Our mission and features" },
  { key: "feedback", label: "Send Feedback", icon: MessageSquare, hint: "Help us improve" },
];

const EMERGENCY_SERVICES = [
  { name: "Unified Emergency", number: "112", description: "Police, ambulance and fire emergency", icon: ShieldAlert },
  { name: "Police", number: "100", description: "Police assistance", icon: ShieldAlert },
  { name: "Fire Brigade", number: "101", description: "Fire and rescue services", icon: Flame },
  { name: "Ambulance", number: "108", description: "Emergency medical assistance", icon: Ambulance },
  { name: "Women Helpline", number: "1091", description: "Women safety support", icon: ShieldAlert },
  { name: "Child Helpline", number: "1098", description: "Child protection support", icon: ShieldAlert },
  { name: "Road Accident Help", number: "1073", description: "Road accident assistance", icon: Ambulance },
  { name: "Cyber Crime", number: "1930", description: "Report cyber fraud or crime", icon: ShieldAlert },
  { name: "Railway Assistance", number: "139", description: "Railway enquiry and help", icon: Phone },
];

const MODAL_CONTENT = {
  safety: { title: "Road Safety Guide", body: "RoadSense is more than a map. The safest response to a warning is usually to slow down, increase following distance and stay focused on the road. Never interact with the app while the vehicle is moving unless it can be done safely.", bullets: ["Slow down near potholes, waterlogging and road work", "Keep extra distance after an accident warning", "Use alerts as guidance, not as a substitute for road signs", "If conditions are dangerous, choose a safer route or stop safely"] },
  how: { title: "How RoadSense Works", body: "RoadSense combines your location, road information and community reports to help you understand what may be ahead. When you report a hazard, the app records its type, location and optional photo. Reports can be reviewed and community activity can help identify useful verified information.", bullets: ["1. Detect — understand where you are", "2. Discover — find nearby hazards and road conditions", "3. Warn — show a clear alert when something may affect your journey", "4. Report — let drivers contribute new hazards", "5. Verify — community and authority workflows improve confidence", "6. Navigate — choose routes with safety information in mind"] },
  privacy: { title: "Privacy & Permissions", body: "RoadSense asks for permissions only when a feature needs them. Location is used for nearby hazard checks and location-aware navigation. Notifications are used for safety warnings when you enable them. Photos are optional when reporting a hazard.", bullets: ["Location — used for positioning and nearby alerts", "Camera — used only when you choose to capture a hazard", "Photos — optional evidence attached to your report", "Notifications — optional safety alerts", "You can manage browser permissions from your device or browser settings"] },
  about: { title: "About RoadSense", body: "RoadSense is a community-focused road safety experience built around one simple idea: give people better information before a road hazard becomes a surprise. The app connects reporting, alerts, safer route planning and authority workflows in one place.", bullets: ["Community hazard reporting", "Nearby road safety alerts", "Hazard-aware route planning", "Photo-based reports", "Authority incident workflows", "Personal alert sound preferences", "Designed for safer, more informed journeys"] },
};

export default function SideMenu({ onClose, onNavigate, language = "en", onLanguageChange }) {
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState({ category: "General", rating: 0, message: "" });
  const [feedbackState, setFeedbackState] = useState("idle");
  const [feedbackError, setFeedbackError] = useState("");

  const handleItem = (item) => {
    if (item.navigate) { onClose(); onNavigate(item.navigate); }
    else { setFeedbackState("idle"); setFeedbackError(""); setModal(item.key); }
  };
  const handleLogout = () => {
    localStorage.removeItem("roadsense-auth");
    sessionStorage.removeItem("roadsense-auth");
    setModal(null);
    onClose();
    window.location.reload();
  };
  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (feedback.message.trim().length < 5) { setFeedbackError("Please write at least 5 characters so we can understand your feedback."); return; }
    setFeedbackState("sending"); setFeedbackError("");
    try { await submitFeedback(feedback); setFeedbackState("success"); }
    catch (error) { console.error("Feedback submission failed:", error); setFeedbackState("error"); setFeedbackError(error?.message || "We could not send your feedback. Please try again."); }
  };
  const closeFeedback = () => { setModal(null); setFeedbackState("idle"); setFeedbackError(""); };

  return (
    <div className="menu-backdrop" onClick={onClose}>
      <aside className="side-menu" onClick={(event) => event.stopPropagation()}>
        <style>{`
          .side-menu .menu-section-title{padding:16px 4px 7px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8b5cf6}.side-menu .side-menu-row{min-height:58px}.side-menu .side-menu-row>span:nth-child(2){display:flex;flex-direction:column;gap:2px}.side-menu .side-menu-row small{font-size:9px;color:var(--muted);font-weight:400}.side-menu .side-menu-brand small{font-size:10px}.side-menu .menu-modal{max-height:82vh;overflow:auto}.side-menu .info-list{display:grid;gap:8px;margin-top:15px;padding:0;list-style:none}.side-menu .info-list li{font-size:11px;line-height:1.45;color:var(--text);padding:9px 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2)}.side-menu .info-list li::first-letter{color:#6d28d9}.side-menu .menu-modal-kicker{font-size:10px;color:#7c3aed;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}.side-menu .menu-modal p{font-size:12px;line-height:1.55}.side-menu .feedback-form{display:grid;gap:11px;margin-top:14px}.side-menu .feedback-form label{display:grid;gap:5px;font-size:10px;font-weight:800;color:var(--text)}.side-menu .feedback-form select,.side-menu .feedback-form textarea{width:100%;box-sizing:border-box;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);color:var(--text);font:inherit;font-size:12px;outline:none}.side-menu .feedback-form select{height:38px;padding:0 10px}.side-menu .feedback-form textarea{min-height:105px;padding:10px;resize:vertical;line-height:1.45}.side-menu .feedback-form select:focus,.side-menu .feedback-form textarea:focus{border-color:#8b5cf6;box-shadow:0 0 0 2px rgba(139,92,246,.14)}.side-menu .feedback-rating{display:flex;gap:5px}.side-menu .feedback-rating button{width:31px;height:31px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--muted);cursor:pointer;font-size:15px}.side-menu .feedback-rating button.active{color:#7c3aed;border-color:#8b5cf6;background:rgba(139,92,246,.12)}.side-menu .feedback-error{margin:0!important;color:#dc2626!important;font-size:10px!important}.side-menu .feedback-success{text-align:center;padding:15px 4px 4px}.side-menu .feedback-success .success-icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;margin:0 auto 10px;background:rgba(34,197,94,.13);color:#16a34a;font-size:23px;font-weight:800}.side-menu .feedback-success h3{margin-bottom:5px}.side-menu .feedback-success p{margin-bottom:14px}.side-menu .emergency-intro{margin-bottom:12px}.side-menu .emergency-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}.side-menu .emergency-item{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}.side-menu .emergency-item>svg{flex:none;color:#a78bfa}.side-menu .emergency-item-main{min-width:0;flex:1}.side-menu .emergency-item-name{font-size:12px;font-weight:800;color:var(--text)}.side-menu .emergency-item-description{font-size:10px;color:var(--muted);line-height:1.35;margin-top:2px}.side-menu .emergency-number{display:block;font-size:15px;font-weight:900;color:var(--text);text-decoration:none;white-space:nowrap}.side-menu .emergency-call{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font-size:10px;font-weight:800;color:#a78bfa;text-decoration:none}.side-menu .emergency-note{font-size:10px!important;color:var(--muted)!important;margin-top:12px!important}
        `}</style>
        <div className="side-menu-head"><button className="side-menu-brand" onClick={() => { onClose(); onNavigate("home"); }} aria-label="Go to RoadSense home"><img src="/roadsense-logo.svg" alt="" /><span><strong>RoadSense</strong><small>See the road ahead, travel safer</small></span></button><button className="icon-btn" onClick={onClose} aria-label="Close menu"><X size={20} /></button></div>
        <div className="side-menu-list">
          <div className="menu-section-title">Your RoadSense</div>
          {ITEMS.slice(0, 8).map((item) => { const Icon = item.icon; return <button key={item.key} className="side-menu-row" onClick={() => handleItem(item)}><Icon size={18} /><span>{item.label}<small>{item.hint}</small></span><ChevronRight size={16} /></button>; })}
          <div className="menu-section-title">More</div>
          {ITEMS.slice(8).map((item) => { const Icon = item.icon; return <button key={item.key} className={`side-menu-row ${item.key === "authority" ? "authority-menu-row" : ""}`} onClick={() => handleItem(item)}><Icon size={18} /><span>{item.label}<small>{item.hint}</small></span><ChevronRight size={16} /></button>; })}
          <button className="side-menu-row" onClick={() => setModal("language")}><Globe2 size={18} /><span>Language<small>Choose your preferred language</small></span><em>{language === "hi" ? "हिंदी" : "English"}</em><ChevronRight size={16} /></button>
          <button className="side-menu-row side-menu-danger" onClick={() => setModal("logout")}><LogOut size={18} /><span>Logout<small>End this RoadSense session</small></span><span /></button>
        </div>
        <div className="side-menu-footer">RoadSense · See the road ahead, travel safer<br />Built to help communities notice hazards earlier and make safer journeys.</div>
        {modal && <div className="menu-modal-backdrop" onClick={() => modal === "feedback" ? closeFeedback() : setModal(null)}><div className="menu-modal" onClick={(event) => event.stopPropagation()}>
          <button className="menu-modal-close" onClick={() => modal === "feedback" ? closeFeedback() : setModal(null)} aria-label="Close"><X size={18} /></button>
          {modal === "trusted" ? <><div className="menu-modal-kicker"><ShieldCheck size={12} /> Emergency support</div><h3>Emergency Services</h3><p className="emergency-intro">Use these numbers when you or someone nearby needs urgent help. Tap a number or Call Now to start a phone call.</p><ul className="emergency-list">{EMERGENCY_SERVICES.map(({ name, number, description, icon: ServiceIcon }) => <li className="emergency-item" key={number}><ServiceIcon size={18} /><div className="emergency-item-main"><div className="emergency-item-name">{name}</div><div className="emergency-item-description">{description}</div></div><div><a className="emergency-number" href={`tel:${number}`}>{number}</a><a className="emergency-call" href={`tel:${number}`}><Phone size={11} /> Call Now</a></div></li>)}</ul><p className="emergency-note">For immediate danger in India, call 112. Do not use emergency numbers for non-urgent enquiries.</p><button className="modal-primary" onClick={() => setModal(null)}>Done</button></> : modal === "language" ? <><div className="menu-modal-kicker">Personalise RoadSense</div><h3>Language</h3><p>Choose how RoadSense labels and guidance should appear.</p><button className="language-choice" onClick={() => { onLanguageChange?.("en"); setModal(null); }}>{language === "en" ? "✓ " : ""}English</button><button className="language-choice" onClick={() => { onLanguageChange?.("hi"); setModal(null); }}>{language === "hi" ? "✓ " : ""}Hindi</button></> : modal === "logout" ? <><h3>Logout</h3><p>Are you sure you want to log out of RoadSense?</p><div className="modal-actions"><button onClick={() => setModal(null)}>Cancel</button><button className="confirm-danger" onClick={handleLogout}>Logout</button></div></> : modal === "feedback" ? <><div className="menu-modal-kicker"><MessageSquare size={12} /> RoadSense feedback</div>{feedbackState === "success" ? <div className="feedback-success"><div className="success-icon">✓</div><h3>Feedback sent!</h3><p>Thank you for helping us improve RoadSense. Your feedback was submitted successfully.</p><button className="modal-primary" onClick={closeFeedback}>Done</button></div> : <><h3>Send Feedback</h3><p>Tell us what worked, what was difficult, or what you would like us to improve.</p><form className="feedback-form" onSubmit={handleFeedbackSubmit}><label>Feedback type<select value={feedback.category} onChange={(event) => setFeedback((current) => ({ ...current, category: event.target.value }))}><option>General</option><option>Bug / Problem</option><option>Map & Navigation</option><option>Alerts</option><option>Report a Hazard</option><option>Login / Account</option><option>Suggestion</option></select></label><label>How would you rate RoadSense? <span className="feedback-rating">{[1,2,3,4,5].map((value) => <button type="button" key={value} className={value <= feedback.rating ? "active" : ""} onClick={() => setFeedback((current) => ({ ...current, rating: value }))} aria-label={`${value} out of 5`}>★</button>)}</span></label><label>Your feedback<textarea value={feedback.message} maxLength={2000} onChange={(event) => setFeedback((current) => ({ ...current, message: event.target.value }))} placeholder="Write your feedback here..." /></label>{feedbackError && <p className="feedback-error">{feedbackError}</p>}<button className="modal-primary" type="submit" disabled={feedbackState === "sending"}>{feedbackState === "sending" ? "Sending…" : "Send Feedback"}</button></form></>}</> : <><div className="menu-modal-kicker"><Route size={12} /> RoadSense guide</div><h3>{MODAL_CONTENT[modal]?.title}</h3><p>{MODAL_CONTENT[modal]?.body}</p><ul className="info-list">{MODAL_CONTENT[modal]?.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><button className="modal-primary" onClick={() => setModal(null)}>Got it</button></>}
        </div></div>}
      </aside>
    </div>
  );
}
