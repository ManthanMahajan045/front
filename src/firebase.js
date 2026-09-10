import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

// Frontend and backend use the same Firebase project. Keep the public web
// config in Vercel/local environment variables instead of source control.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const USE_REAL_FIREBASE = requiredConfig.every(Boolean);

let db = null;
if (USE_REAL_FIREBASE) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };

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
  const payload = {
    hazardType,
    location,
    coordinates,
    reportedBy: reportedBy || "anonymous",
    photo: photo || null,
    upvotes: 0,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  if (USE_REAL_FIREBASE) {
    return addDoc(collection(db, "reports"), payload);
  }

  const reports = readLocalReports();
  const newReport = {
    id: `local_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  reports.push(newReport);
  writeLocalReports(reports);
  return newReport;
}

export async function upvoteReport(reportId) {
  if (USE_REAL_FIREBASE) {
    const reportRef = doc(db, "reports", reportId);
    return runTransaction(db, async (transaction) => {
      const reportDoc = await transaction.get(reportRef);
      if (!reportDoc.exists()) throw new Error("Report not found");
      const data = reportDoc.data();
      const newUpvotes = (data.upvotes || 0) + 1;
      const status = newUpvotes >= 3 ? "verified" : "pending";
      transaction.update(reportRef, { upvotes: newUpvotes, status });
      return newUpvotes;
    });
  }

  const reports = readLocalReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) {
    const fallback = JSON.parse(localStorage.getItem("roadsense_demo_upvotes") || "{}");
    fallback[reportId] = (fallback[reportId] || 0) + 1;
    localStorage.setItem("roadsense_demo_upvotes", JSON.stringify(fallback));
    return fallback[reportId];
  }
  reports[idx].upvotes += 1;
  reports[idx].status = reports[idx].upvotes >= 3 ? "verified" : "pending";
  writeLocalReports(reports);
  return reports[idx].upvotes;
}

export async function getReports() {
  if (USE_REAL_FIREBASE) {
    const snapshot = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }
  return readLocalReports();
}

export function getLocalReports() {
  return readLocalReports();
}
