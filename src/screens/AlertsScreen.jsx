import { useState, useEffect, useMemo } from "react";
import { Bell, LocateFixed, Play, Volume2, CheckCircle2, AlertTriangle, Droplets, Construction, CarFront } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { getLocalReports } from "../firebase";
import { distanceKm, getCurrentLocation } from "../utils/geo";

const ALERT_RADIUS_KM = 5;
const NOTIFIED_KEY = "roadsense_notified_alerts";
const ALERT_TONE_KEY = "roadsense_alert_tone";

const SAMPLE_ALERTS = [
  { id: "sample-pothole", title: "Pothole Ahead", message: "A road hazard may be ahead on your route.", severity: "High", Icon: AlertTriangle },
  { id: "sample-water", title: "Waterlogging Nearby", message: "Slow down and watch for standing water.", severity: "Medium", Icon: Droplets },
  { id: "sample-roadwork", title: "Road Work Ahead", message: "Expect lane changes or slower traffic.", severity: "Medium", Icon: Construction },
  { id: "sample-accident", title: "Accident Reported", message: "Drive carefully and keep extra distance.", severity: "High", Icon: CarFront },
];

const ALERT_TONES = [
  { id: "soft-chime", name: "Soft Chime", description: "Calm and gentle", notes: [523.25, 659.25, 783.99] },
  { id: "double-beep", name: "Double Beep", description: "Short and clear", notes: [880, 660] },
  { id: "pulse-alert", name: "Pulse Alert", description: "Quick attention signal", notes: [440, 440, 880] },
  { id: "rising-ping", name: "Rising Ping", description: "Gets your attention smoothly", notes: [392, 523.25, 659.25, 783.99] },
  { id: "safety-bell", name: "Safety Bell", description: "Bright notification tone", notes: [659.25, 783.99, 659.25, 1046.5] },
];

function browserNotify(alert) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notification = new Notification("RoadSense alert", {
    body: `${alert.title} is ${alert.distance < 1 ? `${Math.round(alert.distance * 1000)} m` : `${alert.distance.toFixed(1)} km`} away. Drive carefully.`,
    tag: `roadsense-${alert.id}`,
    icon: "/roadsense-logo.svg",
  });
  notification.onclick = () => { window.focus(); notification.close(); };
}

function playTone(toneId) {
  const tone = ALERT_TONES.find((item) => item.id === toneId) || ALERT_TONES[0];
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  tone.notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.16;
    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.15);
  });
  window.setTimeout(() => context.close().catch(() => {}), tone.notes.length * 180 + 400);
}

export default function AlertsScreen({ onNavigate }) {
  const [tab, setTab] = useState("active");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [notificationStatus, setNotificationStatus] = useState("default");
  const [tone, setTone] = useState(() => localStorage.getItem(ALERT_TONE_KEY) || "soft-chime");
  const [showSamples, setShowSamples] = useState(false);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return setNotificationStatus("unsupported");
    setNotificationStatus(await Notification.requestPermission());
  };

  async function checkNearbyHazards() {
    setLocationStatus("loading");
    try {
      const { lat, lng } = await getCurrentLocation({ timeout: 15000, targetAccuracy: 12 });
      setLocationStatus("granted");
      const allHazards = [
        ...confirmedHazards.map((h) => ({ id: h.id, title: h.name, severity: h.severityLabel, coords: h.coordinates })),
        ...getLocalReports().map((r) => ({ id: r.id, title: r.hazardType, severity: r.status === "verified" ? "Verified" : "Pending", location: r.location, coords: r.coordinates })),
      ].filter((h) => h.coords?.lat && h.coords?.lng);
      const nearby = allHazards.map((h) => ({ ...h, distance: distanceKm(lat, lng, h.coords.lat, h.coords.lng) })).filter((h) => h.distance <= ALERT_RADIUS_KM).sort((a, b) => a.distance - b.distance);
      setActiveAlerts(nearby);
      setHistory(allHazards.filter((h) => !nearby.some((n) => n.id === h.id)));
      const alreadyNotified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]");
      const fresh = nearby.filter((h) => !alreadyNotified.includes(h.id));
      fresh.slice(0, 3).forEach((alert) => { browserNotify(alert); playTone(tone); });
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...new Set([...alreadyNotified, ...fresh.map((h) => h.id)])].slice(-100)));
    } catch { setLocationStatus("denied"); }
  }

  useEffect(() => {
    if ("Notification" in window) setNotificationStatus(Notification.permission);
    checkNearbyHazards();
  }, []);

  useEffect(() => { localStorage.setItem(ALERT_TONE_KEY, tone); }, [tone]);

  const listToShow = useMemo(() => tab === "active" ? activeAlerts : history, [tab, activeAlerts, history]);
  const selectedTone = ALERT_TONES.find((item) => item.id === tone) || ALERT_TONES[0];

  return (
    <div className="screen">
      <TopBar variant="back" title="Alerts" onBack={() => onNavigate("home")} onNavigate={onNavigate} />

      <div className="alert-settings-card">
        <div><div className="alert-settings-title"><Bell size={17} /> Safety notifications</div><div className="alert-settings-sub">Get a browser alert and your chosen sound when nearby hazards are detected.</div></div>
        <button className="notify-btn" onClick={requestNotifications} disabled={notificationStatus === "granted"}>{notificationStatus === "granted" ? "Enabled" : "Enable"}</button>
      </div>

      <section className="alert-preferences-panel">
        <div className="alert-panel-heading"><div><span className="alert-panel-kicker">Make it yours</span><h2>Choose your alert sound</h2></div><Volume2 size={20} /></div>
        <p>Pick a tone you will recognize quickly while driving. You can change it anytime.</p>
        <div className="tone-list">
          {ALERT_TONES.map((item) => (
            <button key={item.id} className={`tone-option ${tone === item.id ? "selected" : ""}`} onClick={() => { setTone(item.id); playTone(item.id); }}>
              <span className="tone-check">{tone === item.id ? <CheckCircle2 size={18} /> : <span />}</span>
              <span className="tone-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
              <Play size={15} />
            </button>
          ))}
        </div>
        <div className="tone-selected-note">Selected: <strong>{selectedTone.name}</strong> · Tap any sound to preview it</div>
      </section>

      <section className="sample-alert-panel">
        <button className="sample-alert-toggle" onClick={() => setShowSamples((value) => !value)}>
          <div><span className="alert-panel-kicker">Try it before you drive</span><strong>Sample alerts</strong><small>See exactly what a RoadSense warning can look and sound like</small></div>
          <span>{showSamples ? "Hide" : "Preview"}</span>
        </button>
        {showSamples && <div className="sample-alert-list">
          {SAMPLE_ALERTS.map((sample) => { const Icon = sample.Icon; return (
            <div className="sample-alert" key={sample.id}>
              <div className="sample-alert-icon"><Icon size={18} /></div>
              <div className="sample-alert-copy"><strong>{sample.title}</strong><span>{sample.message}</span><small>{sample.severity} priority · Example warning</small></div>
              <button aria-label={`Test ${sample.title} alert`} onClick={() => playTone(tone)}><Play size={15} /></button>
            </div>
          ); })}
        </div>}
      </section>

      <div className="tabs"><button className={`tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>Active {activeAlerts.length > 0 && <span className="tab-count">{activeAlerts.length}</span>}</button><button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>History</button></div>
      {locationStatus === "loading" && <p className="empty-state">Checking your location…</p>}
      {locationStatus === "denied" && <div className="card location-permission"><p>Location permission nahi mili — nearby hazards check nahi ho sakte.</p><button onClick={checkNearbyHazards}><LocateFixed size={14} /> Try again</button></div>}
      {locationStatus === "granted" && listToShow.length === 0 && <p className="empty-state">{tab === "active" ? `No hazard within ${ALERT_RADIUS_KM} km.` : "No alert history yet."}</p>}
      {listToShow.map((alert) => <div className="card alert-card" key={alert.id}><div className="alert-dot" /><div className="alert-card-content"><div className="card-title">{alert.title}</div><div className="card-meta">{alert.location ? `${alert.location} · ` : ""}{alert.distance !== undefined ? `${alert.distance < 1 ? `${Math.round(alert.distance * 1000)} m` : `${alert.distance.toFixed(1)} km`} away` : ""}{alert.severity ? ` · ${alert.severity}` : ""}</div></div></div>)}
      <BottomNav active="alerts" onNavigate={onNavigate} alertCount={activeAlerts.length} />
    </div>
  );
}
