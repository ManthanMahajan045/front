import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, Camera, CheckCircle2, ChevronLeft, ExternalLink, HardDrive, Info, LockKeyhole, MapPin, Mic, RefreshCw, ShieldCheck } from "lucide-react";
import "./PrivacyPermissionsScreen.css";

const PERMISSIONS = [
  { key: "geolocation", title: "Location", icon: MapPin, why: "Used only when you choose location features such as positioning and nearby road alerts." },
  { key: "notifications", title: "Notifications", icon: Bell, why: "Used only for safety warnings and alerts after you enable notifications." },
  { key: "camera", title: "Camera", icon: Camera, why: "Used only when you choose to capture a photo for a hazard report." },
  { key: "microphone", title: "Microphone", icon: Mic, why: "RoadSense does not currently need your microphone. No microphone access is requested by this app." },
  { key: "storage", title: "Storage", icon: HardDrive, why: "RoadSense does not request a separate storage permission. Browser storage is controlled by your browser." },
];

const LABELS = { granted: "Allowed", denied: "Denied", prompt: "Not Requested", unsupported: "Not Requested" };

function permissionLabel(state) {
  return LABELS[state] || "Not Requested";
}

function errorMessage(error, permission) {
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return `${permission} access was denied. You can allow it later from this site's browser permissions.`;
  }
  if (error?.name === "NotFoundError") return `No ${permission.toLowerCase()} device is available right now.`;
  if (error?.name === "SecurityError") return `${permission} access is blocked because this page is not running in a secure browser context.`;
  if (error?.name === "AbortError") return `${permission} access was cancelled. Nothing was saved.`;
  return `We could not access ${permission.toLowerCase()}. Nothing was saved or shared.`;
}

export default function PrivacyPermissionsScreen({ onNavigate, onMenu }) {
  const [statuses, setStatuses] = useState({ geolocation: "prompt", notifications: "prompt", camera: "prompt", microphone: "prompt", storage: "prompt" });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const permissionNames = useMemo(() => ({ geolocation: "geolocation", notifications: "notifications", camera: "camera", microphone: "microphone" }), []);

  const readPermission = useCallback(async (key) => {
    if (key === "storage") return "prompt";
    if (key === "notifications" && typeof Notification !== "undefined") {
      if (Notification.permission === "granted") return "granted";
      if (Notification.permission === "denied") return "denied";
    }
    if (!navigator.permissions?.query) return "prompt";
    try {
      const result = await navigator.permissions.query({ name: permissionNames[key] });
      return result.state || "prompt";
    } catch {
      return key === "notifications" && typeof Notification !== "undefined" ? (Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "prompt") : "prompt";
    }
  }, [permissionNames]);

  const refreshStatuses = useCallback(async () => {
    const next = {};
    for (const item of PERMISSIONS) next[item.key] = await readPermission(item.key);
    setStatuses(next);
  }, [readPermission]);

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const clearFeedback = () => { setMessage(""); setError(""); };

  const requestPermission = async (key) => {
    clearFeedback();
    setBusy(key);
    try {
      if (key === "geolocation") {
        if (!navigator.geolocation) throw new Error("Geolocation is not supported by this browser.");
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(() => resolve(), (geoError) => reject({ name: geoError.code === 1 ? "PermissionDeniedError" : geoError.code === 2 ? "PositionUnavailableError" : "TimeoutError" }), { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
        });
        setMessage("Location is allowed. Your coordinates were used only to confirm the permission and were not stored by this screen.");
      } else if (key === "notifications") {
        if (typeof Notification === "undefined") throw new Error("Notifications are not supported by this browser.");
        const result = await Notification.requestPermission();
        if (result === "granted") setMessage("Notifications are now allowed. RoadSense can show safety alerts when the feature needs them.");
        else if (result === "denied") setError("Notifications were denied. You can change this later in your browser's site permissions.");
        else setMessage("Notifications were not enabled. No notification data was collected.");
      } else if (key === "camera" || key === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access are not supported by this browser.");
        const stream = await navigator.mediaDevices.getUserMedia(key === "camera" ? { video: true, audio: false } : { video: false, audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMessage(`${key === "camera" ? "Camera" : "Microphone"} access is allowed. The temporary test stream was closed immediately and no recording was made.`);
      } else {
        setMessage("RoadSense does not request a separate storage permission. Your browser controls site storage and you can clear it from the browser's site settings.");
      }
    } catch (requestError) {
      setError(requestError?.message && !["PermissionDeniedError", "NotAllowedError", "NotFoundError", "SecurityError", "AbortError"].includes(requestError?.name) ? requestError.message : errorMessage(requestError, PERMISSIONS.find((item) => item.key === key)?.title || "Permission"));
    } finally {
      await refreshStatuses();
      setBusy("");
    }
  };

  const managePermission = async (key) => {
    clearFeedback();
    if (key === "storage") {
      setMessage("Storage permissions are managed by the browser. Use the site settings or privacy settings for this website to clear or change stored site data.");
      return;
    }
    if (typeof navigator.permissions?.revoke === "function") {
      try {
        await navigator.permissions.revoke({ name: permissionNames[key] });
        setMessage(`${PERMISSIONS.find((item) => item.key === key)?.title || "Permission"} permission was revoked.`);
        await refreshStatuses();
        return;
      } catch {
        // Browser did not allow programmatic revocation; fall through to the manual instructions.
      }
    }
    setMessage("Browsers generally do not allow websites to revoke a granted permission programmatically. Use the site permissions/settings control in your browser to change or revoke it.");
  };

  return (
    <div className="privacy-screen">
      <header className="privacy-header">
        <button className="privacy-back" onClick={() => onNavigate?.("home")} aria-label="Back to Home"><ChevronLeft size={20} /></button>
        <div><div className="privacy-kicker"><LockKeyhole size={13} /> Privacy</div><h1>Privacy & Permissions</h1></div>
        <button className="privacy-refresh" onClick={() => { clearFeedback(); refreshStatuses(); }} disabled={busy} aria-label="Refresh permission status"><RefreshCw size={18} className={busy ? "privacy-spin" : ""} /></button>
      </header>

      <main className="privacy-content">
        <section className="privacy-notice">
          <ShieldCheck size={22} />
          <div><strong>You stay in control</strong><p>RoadSense does not request these permissions automatically. A permission prompt appears only after you choose the related action. We do not store permission test data, camera/microphone recordings, or location coordinates from this screen.</p></div>
        </section>

        {message && <div className="privacy-feedback privacy-feedback-success" role="status"><CheckCircle2 size={17} /><span>{message}</span><button onClick={clearFeedback} aria-label="Dismiss message">×</button></div>}
        {error && <div className="privacy-feedback privacy-feedback-error" role="alert"><AlertCircle size={17} /><span>{error}</span><button onClick={clearFeedback} aria-label="Dismiss error">×</button></div>}

        <section className="privacy-list" aria-label="Permission status">
          {PERMISSIONS.map(({ key, title, icon: Icon, why }) => {
            const status = permissionLabel(statuses[key]);
            const isUnsupported = key === "microphone" && statuses[key] === "prompt";
            return <article className="privacy-card" key={key}>
              <div className="privacy-card-icon"><Icon size={19} /></div>
              <div className="privacy-card-main">
                <div className="privacy-card-title"><h2>{title}</h2><span className={`permission-status permission-${statuses[key] === "granted" ? "granted" : statuses[key] === "denied" ? "denied" : "prompt"}`}>{status}</span></div>
                <p>{why}</p>
                {isUnsupported && <small className="privacy-muted">Current app build does not request microphone access.</small>}
              </div>
              <div className="privacy-card-actions">
                {key !== "microphone" || statuses[key] !== "prompt" ? <button className="privacy-action" onClick={() => requestPermission(key)} disabled={busy === key}>{busy === key ? "Checking…" : statuses[key] === "granted" ? "Test again" : "Enable"}</button> : null}
                {statuses[key] === "granted" && <button className="privacy-manage" onClick={() => managePermission(key)}>Change / revoke</button>}
                {statuses[key] === "denied" && key !== "storage" && <button className="privacy-manage" onClick={() => managePermission(key)}>Manage in browser</button>}
              </div>
            </article>;
          })}
        </section>

        <section className="privacy-info">
          <Info size={17} /><div><strong>About browser permissions</strong><p>Allowed, Denied, and Not Requested are read from the browser where its Permissions API is available. Browsers may keep their own permission controls, so RoadSense cannot always change or revoke a decision itself.</p><button onClick={() => setMessage("For a manual change, open your browser's site information/permissions for the RoadSense website, then change Location, Notifications, Camera, or Microphone. Storage can be cleared from the same site settings.")}><ExternalLink size={14} /> Show browser settings guidance</button></div>
        </section>
      </main>
    </div>
  );
}
