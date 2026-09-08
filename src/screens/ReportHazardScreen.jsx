import { useState, useEffect, useRef } from "react";
import { Camera, X } from "lucide-react";
import TopBar from "../components/TopBar";
import { hazardTypeOptions } from "../sampleData";
import { submitHazardReport } from "../firebase";
import { getCurrentLocation, reverseGeocode } from "../utils/geo";

export default function ReportHazardScreen({ onNavigate }) {
  const [selectedType, setSelectedType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photo, setPhoto] = useState(null); // base64 preview

  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("Detecting...");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCurrentLocation()
      .then(async (loc) => {
        setCoords(loc);
        try {
          const readable = await reverseGeocode(loc.lat, loc.lng);
          setAddress(readable);
        } catch {
          setAddress(`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
        }
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
    if (!selectedType) {
      setError("Pehle hazard type select karo.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitHazardReport({
        hazardType: selectedType,
        location: address,
        coordinates: coords,
        reportedBy: null,
        photo, // base64 image, or null if skipped
      });
      onNavigate("reports");
    } catch (err) {
      console.error("Report submit failed:", err);
      setError("Report submit nahi hua, dobara try karo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <TopBar variant="back" title="Report a Hazard" onBack={() => onNavigate("home")} />

      <p style={{ padding: "12px 20px 0", fontSize: 13, color: "#6b7280" }}>
        Help other drivers by reporting hazards on the road.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        style={{ display: "none" }}
      />

      {photo ? (
        <div style={{ position: "relative", margin: "16px 20px" }}>
          <img
            src={photo}
            alt="Hazard preview"
            style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
          />
          <button
            onClick={() => setPhoto(null)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>
      ) : (
        <div
          className="placeholder-block"
          style={{
            height: 140,
            margin: "16px 20px",
            flexDirection: "column",
            gap: 6,
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={22} />
          Tap to add photo
        </div>
      )}

      <div className="section-label">What did you find?</div>
      <div className="hazard-grid">
        {hazardTypeOptions.map((type) => (
          <button
            key={type}
            className={`hazard-option ${selectedType === type ? "selected" : ""}`}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="section-label">Location</div>
      <div className="location-box">
        <div className="label">Current Location</div>
        <div className="value">{address}</div>
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 12, margin: "10px 20px 0" }}>{error}</p>
      )}

      <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </div>
  );
}
