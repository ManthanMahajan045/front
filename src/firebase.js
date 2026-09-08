import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Jab Harsh real Firebase config de, yahan paste kar do aur neeche
// USE_REAL_FIREBASE ko true kar do. Tab tak app localStorage pe chalega
// (demo mode) -- buttons abhi bhi fully kaam karte hain, bas data
// asli database mein nahi jaata.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const USE_REAL_FIREBASE = false; // <-- Harsh ka config aane par "true" kar do

let db = null;
if (USE_REAL_FIREBASE) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}
export { db };

// ---------------------------------------------------------------------------
// Local demo-mode storage (localStorage-backed) -- real Firestore jaisa
// hi behavior deta hai (async, same return shape) taaki screens mein
// koi extra code na likhna pade jab real Firebase switch on ho.
// ---------------------------------------------------------------------------
const LOCAL_KEY = "roadsense_demo_reports";

function readLocalReports() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocalReports(reports) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(reports));
}

export async function submitHazardReport({ hazardType, location, coordinates, reportedBy, photo }) {
  if (USE_REAL_FIREBASE) {
    const reportsRef = collection(db, "reports");
    return addDoc(reportsRef, {
      hazardType,
      location,
      coordinates,
      reportedBy: reportedBy || "anonymous",
      photo: photo || null,
      upvotes: 0,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

  // Demo mode
  const reports = readLocalReports();
  const newReport = {
    id: `local_${Date.now()}`,
    hazardType,
    location,
    coordinates,
    reportedBy: reportedBy || "anonymous",
    photo: photo || null,
    upvotes: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  reports.push(newReport);
  writeLocalReports(reports);
  console.log("[demo mode] Report saved locally:", newReport);
  return newReport;
}

export async function upvoteReport(reportId) {
  if (USE_REAL_FIREBASE) {
    const reportRef = doc(db, "reports", reportId);
    return runTransaction(db, async (transaction) => {
      const reportDoc = await transaction.get(reportRef);
      if (!reportDoc.exists()) throw new Error("Report not found");
      const newUpvotes = (reportDoc.data().upvotes || 0) + 1;
      transaction.update(reportRef, {
        upvotes: newUpvotes,
        status: newUpvotes >= 3 ? "verified" : "pending",
      });
      return newUpvotes;
    });
  }

  // Demo mode
  const reports = readLocalReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) {
    // Report wasn't created via submitHazardReport (e.g. sample data) --
    // still let the upvote work by tracking it separately.
    const fallback = JSON.parse(localStorage.getItem("roadsense_demo_upvotes") || "{}");
    fallback[reportId] = (fallback[reportId] || 0) + 1;
    localStorage.setItem("roadsense_demo_upvotes", JSON.stringify(fallback));
    return fallback[reportId];
  }
  reports[idx].upvotes += 1;
  reports[idx].status = reports[idx].upvotes >= 3 ? "verified" : "pending";
  writeLocalReports(reports);
  console.log("[demo mode] Upvoted:", reports[idx]);
  return reports[idx].upvotes;
}

export function getLocalReports() {
  return readLocalReports();
}
