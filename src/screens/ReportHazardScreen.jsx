import { useState, useEffect, useRef } from "react";
import { Camera, ImagePlus, X, MapPin } from "lucide-react";
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
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentLocation({ timeout: 8000, targetAccuracy: 50 })
      .then((loc) => {
        if (cancelled) return;
        setCoords(loc);
        // Address is cosmetic. Do not make report submission wait for the
        // reverse-geocoding network request.
        reverseGeocode(loc.lat, loc.lng, 3500)
          .then((result) => { if (!cancelled) setAddress(result); })
          .catch(() => { if (!cancelled) setAddress(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`); });
      })
      .catch(() => { if (!cancelled) setAddress("Location not available — enable location access"); });
    return () => { cancelled = true; };
  }, []);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!selectedType) { setError("Please select a hazard type first."); return; }
    if (!coords) { setError("Location is still being detected. Please wait a few seconds and try again."); return; }
    setSubmitting(true); setError(null);
    try {
      const result = await submitHazardReport({ hazardType: selectedType, location: address, coordinates: coords, photo });
      if (result?.photoUploadWarning) {
        console.info("Report saved without photo because Firebase Storage was unavailable:", result.photoUploadWarning);
      }
      onNavigate("reports");
    } catch (err) {
      console.error("Report submit failed:", err);
      const code = err?.code || "";
      if (code.includes("permission-denied")) setError("Firebase permission denied. Please log in again and try submitting.");
      else if (code.includes("unauthenticated")) setError("Your login session expired. Please log in again.");
      else if (code.includes("failed-precondition")) setError("Firebase needs its database index/configuration updated. Try again after a moment.");
      else if (code.includes("unavailable") || code.includes("network")) setError("Network connection issue. Check your internet and try again.");
      else setError(err?.message || "Report submit nahi hua, dobara try karo.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="screen report-screen">
      <TopBar variant="back" title="Report a Hazard" onBack={() => onNavigate("home")} />
      <p className="report-intro">Help other drivers by reporting hazards on the road.</p>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: "none" }} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
      {photo ? (
        <div className="photo-preview-wrap"><img src={photo} alt="Hazard preview" className="photo-preview" /><button className="photo-remove" onClick={() => setPhoto(null)} aria-label="Remove photo"><X size={16} /></button></div>
      ) : (
        <div className="photo-upload-area">
          <div className="photo-upload-heading"><ImagePlus size={22} /><strong>Add a photo</strong></div>
          <span className="photo-upload-hint">Capture the hazard now or choose a photo from your phone</span>
          <div className="photo-upload-actions">
            <button type="button" className="photo-upload-option" onClick={() => cameraInputRef.current?.click()}><Camera size={19} /><span>Camera</span></button>
            <button type="button" className="photo-upload-option" onClick={() => galleryInputRef.current?.click()}><ImagePlus size={19} /><span>Gallery</span></button>
          </div>
        </div>
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
