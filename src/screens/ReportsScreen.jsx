import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { upvoteReport, getLocalReports } from "../firebase";

export default function ReportsScreen({ onNavigate }) {
  const [tab, setTab] = useState("mine");
  const [myReports, setMyReports] = useState([]);

  // Re-read every time this screen opens so newly submitted reports show up.
  useEffect(() => {
    setMyReports(getLocalReports());
  }, []);

  async function handleUpvote(id) {
    try {
      const newCount = await upvoteReport(id);
      setMyReports((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, upvotes: newCount, status: newCount >= 3 ? "verified" : "pending" }
            : h
        )
      );
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  }

  // "My Reports" = things you personally submitted.
  // "Community Verified" = your upvote-verified reports + the official confirmed hazard list.
  const verifiedMine = myReports.filter((r) => r.status === "verified");
  const visible = tab === "mine" ? myReports : [...verifiedMine, ...confirmedHazards];

  return (
    <div className="screen">
      <TopBar variant="back" title="Reports" onBack={() => onNavigate("home")} />

      <div className="tabs">
        <button
          className={`tab ${tab === "mine" ? "active" : ""}`}
          onClick={() => setTab("mine")}
        >
          My Reports
        </button>
        <button
          className={`tab ${tab === "verified" ? "active" : ""}`}
          onClick={() => setTab("verified")}
        >
          Community Verified
        </button>
      </div>

      {visible.length === 0 && (
        <p style={{ padding: "20px", fontSize: 13, color: "#6b7280" }}>
          {tab === "mine"
            ? "Abhi koi report submit nahi kiya — 'Report a Hazard' se ek banao."
            : "Abhi koi verified report nahi hai."}
        </p>
      )}

      {visible.map((report) => (
        <div className="card" key={report.id} style={{ display: "flex", gap: 10 }}>
          {report.photo && (
            <img
              src={report.photo}
              alt={report.hazardType || report.name}
              style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div className="card-title">{report.hazardType || report.name}</div>
            <div className="card-meta">{report.location || report.source}</div>
            <div
              className="card-meta"
              style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}
            >
              <span>{report.status === "verified" ? "Verified" : "Pending"}</span>
              {report.upvotes !== undefined && (
                <button
                  onClick={() => handleUpvote(report.id)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#6d28d9",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  👍 {report.upvotes} upvotes
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <BottomNav active="reports" onNavigate={onNavigate} />
    </div>
  );
}
