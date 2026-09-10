import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { confirmedHazards } from "../sampleData";
import { upvoteReport, getMyReports, getReports } from "../firebase";

export default function ReportsScreen({ onNavigate, user }) {
  const [tab, setTab] = useState("mine");
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      setLoading(true);
      const [mine, community] = await Promise.all([getMyReports(user?.firebaseUid), getReports()]);
      setMyReports(mine);
      setCommunityReports(community.filter((r) => r.status === "verified"));
    } catch (err) {
      console.error("Reports load failed:", err);
      setMyReports([]);
      setCommunityReports([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadReports(); }, [user?.firebaseUid]);

  async function handleUpvote(id) {
    try {
      const newCount = await upvoteReport(id);
      setMyReports((prev) => prev.map((h) => h.id === id ? { ...h, upvotes: newCount, status: newCount >= 3 ? "verified" : "pending" } : h));
      setCommunityReports((prev) => prev.map((h) => h.id === id ? { ...h, upvotes: newCount, status: newCount >= 3 ? "verified" : "pending" } : h));
    } catch (err) { console.error("Upvote failed:", err); }
  }

  const visible = tab === "mine" ? myReports : [...communityReports, ...confirmedHazards];

  return <div className="screen"><TopBar variant="back" title="Reports" onBack={() => onNavigate("home")} onNavigate={onNavigate} /><div className="tabs"><button className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My Reports</button><button className={`tab ${tab === "verified" ? "active" : ""}`} onClick={() => setTab("verified")}>Community Verified</button></div>{loading && <p style={{ padding: "20px", fontSize: 13, color: "#6b7280" }}>Loading reports…</p>}{!loading && visible.length === 0 && <p style={{ padding: "20px", fontSize: 13, color: "#6b7280" }}>{tab === "mine" ? "You haven't submitted any reports yet. Create your first report using 'Report a Hazard'." : "There are no verified reports available at the moment."}</p>}{visible.map((report) => { const image = report.photo || report.photoData; return <div className="card" key={report.id} style={{ display: "flex", gap: 10 }}>{image && <img src={image} alt={report.hazardType || report.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}<div style={{ flex: 1 }}><div className="card-title">{report.hazardType || report.name}</div><div className="card-meta">{report.location || report.source}</div><div className="card-meta" style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}><span>{report.status === "verified" ? "Verified" : "Pending"}</span>{report.upvotes !== undefined && <button onClick={() => handleUpvote(report.id)} style={{ border: "none", background: "none", color: "#6d28d9", fontSize: 12, cursor: "pointer" }}>👍 {report.upvotes} upvotes</button>}</div></div></div>; })}<BottomNav active="reports" onNavigate={onNavigate} /></div>;
}
