import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
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
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// RoadSense production Firebase web app configuration.
// Environment variables can override these values for local/staging use.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDrvaJONaD-CK2_W1dLkUA-NtwhFBChPkU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "road-sense-bca4e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "road-sense-bca4e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "road-sense-bca4e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1032531366359",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1032531366359:web:4855fc7461fbb3d4c13b92",
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
let auth = null;
let storage = null;
if (USE_REAL_FIREBASE) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { db, auth, storage };

async function ensureAuthenticated() {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

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
    const user = await ensureAuthenticated();
    let photoUrl = null;

    if (photo && storage) {
      const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}.jpg`);
      await uploadString(fileRef, photo, "data_url", { contentType: "image/jpeg" });
      photoUrl = await getDownloadURL(fileRef);
    }

    return addDoc(collection(db, "reports"), {
      hazardType,
      location,
      coordinates,
      reportedBy: user?.uid || reportedBy || "anonymous",
      photo: photoUrl,
      upvotes: 0,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

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
  return newReport;
}

export async function upvoteReport(reportId) {
  if (USE_REAL_FIREBASE) {
    await ensureAuthenticated();
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
    await ensureAuthenticated();
    const snapshot = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }
  return readLocalReports();
}

export function getLocalReports() {
  return readLocalReports();
}
