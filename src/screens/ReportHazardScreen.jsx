import { useState, useEffect, useRef } from "react";
import { Camera, X, MapPin } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { hazardTypeOptions } from "../sampleData";
import { submitHazardReport } from "../firebase";
import { getCurrentLocation, reverseGeocode } from "../utils/geo";

export default function ReportHazardScreen({ onNavigate }) {
  const [selectedType, setSelectedType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("Detecting your location…");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation()
      .then(async (loc) => {
        setCoords(loc);
        try { setAddress(await reverseGeocode(loc.lat, loc.lng)); }
        catch { setAddress(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`); }
      })
      .catch(() => setAddress("Location not available — enable location access"));
  }, []);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!selectedType) { setError("Please select a hazard type first."); return; }
    if (!coords) { setError("Your location is still being detected. Please try again in a moment."); return; }
    setSubmitting(true); setError(null);
    try {
      await submitHazardReport({ hazardType: selectedType, location: address, coordinates: coords, reportedBy: null, photo });
      onNavigate("reports");
    } catch (err) {
      console.error("Report submit failed:", err);
      setError("Report submit nahi hua, dobara try karo.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="screen report-screen">
      <TopBar variant="back" title="Report a Hazard" onBack={() => onNavigate("home")} />
      <p className="report-intro">Help other drivers by reporting hazards on the road.</p>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: "none" }} />
      {photo ? (
        <div className="photo-preview-wrap"><img src={photo} alt="Hazard preview" className="photo-preview" /><button className="photo-remove" onClick={() => setPhoto(null)} aria-label="Remove photo"><X size={16} /></button></div>
      ) : (
        <button className="photo-placeholder" onClick={() => fileInputRef.current?.click()}><Camera size={28} /><strong>Add Photo</strong><span>Show the hazard clearly</span></button>
      )}
      <div className="section-label">What did you find?</div>
      <div className="hazard-grid">{hazardTypeOptions.map((type) => <button key={type} className={`hazard-option ${selectedType === type ? "selected" : ""}`} onClick={() => setSelectedType(type)}>{type}</button>)}</div>
      <div className="section-label">Location</div>
      <div className="location-box"><MapPin size={17} /><div><div className="label">Current Location</div><div className="value">{address}</div></div></div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit Report"}</button>
      <BottomNav active="reports" onNavigate={onNavigate} />
    </div>
  );
}
