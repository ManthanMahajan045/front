import { Ambulance, CarFront, Flame, PhoneCall, Shield, Siren, Navigation, MapPin } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

const ACTIONS = [
  { label: "112 Emergency", detail: "National emergency number", icon: Siren, href: "tel:112", primary: true },
  { label: "Police", detail: "Call police assistance", icon: Shield, href: "tel:100" },
  { label: "Ambulance", detail: "Medical emergency", icon: Ambulance, href: "tel:108" },
  { label: "Fire", detail: "Fire & rescue", icon: Flame, href: "tel:101" },
  { label: "Highway Assistance", detail: "Roadside help", icon: CarFront, href: "tel:1033" },
];

export default function EmergencyScreen({ onNavigate }) {
  return (
    <div className="screen mobile-page emergency-screen">
      <TopBar variant="back" title="Emergency" onBack={() => onNavigate("home")} onNavigate={onNavigate} />
      <section className="emergency-hero">
        <div className="emergency-hero-icon"><PhoneCall size={24} /></div>
        <h1>Need immediate help?</h1>
        <p>Use the large call buttons below. Your phone will open the dialer for the selected service.</p>
      </section>
      <div className="emergency-grid">
        {ACTIONS.map(({ label, detail, icon: Icon, href, primary }) => (
          <a className={`emergency-card ${primary ? "primary" : ""}`} href={href} key={label}>
            <Icon size={23} />
            <span><strong>{label}</strong><span>{detail}</span></span>
          </a>
        ))}
      </div>
      <div className="emergency-section-label">Nearby help</div>
      <div className="emergency-hospital">
        <div><strong>Find a nearby hospital</strong><span>Use your current location for navigation.</span></div>
        <button onClick={() => onNavigate("search")}><MapPin size={13} /> Find</button>
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
