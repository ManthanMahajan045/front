import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, runTransaction, updateDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// RoadSense production Firebase web app configuration from Firebase Console.
// This intentionally ignores stale Vercel VITE_* overrides so the deployed app
// cannot accidentally initialize Firebase with an old/invalid API key.
const firebaseConfig = {
  apiKey: "AIzaSyDrvaJONaD-CK2_WldLkUA-NtwhFBChPkU",
  authDomain: "road-sense-bca4e.firebaseapp.com",
  projectId: "road-sense-bca4e",
  storageBucket: "road-sense-bca4e.firebasestorage.app",
  messagingSenderId: "1032531366359",
  appId: "1:1032531366359:web:4855fc7461fbb3d4c13b92",
};

export const USE_REAL_FIREBASE = true;
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
export { db, auth, storage };

async function ensureAuthenticated() {
  if (!auth.currentUser) {
    throw new Error("Your Firebase session is missing. Please log in again before submitting a report.");
  }
  return auth.currentUser;
}

export async function signUpWithEmail(email, password, name) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name?.trim()) await updateProfile(result.user, { displayName: name.trim() });
  await saveUserProfile(result.user, { name: name?.trim() || email.split("@")[0], email: result.user.email || email.trim(), method: "email" });
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return { user: result.user, profile: await getUserProfile(result.user.uid) };
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const profile = await saveUserProfile(result.user, {
    name: result.user.displayName || "RoadSense user",
    email: result.user.email || "",
    method: "google",
  });
  return { user: result.user, profile };
}

export async function saveUserProfile(firebaseUser, data = {}) {
  if (!firebaseUser) return null;
  const profile = {
    uid: firebaseUser.uid,
    name: data.name?.trim() || firebaseUser.displayName || "RoadSense user",
    email: data.email || firebaseUser.email || "",
    phone: data.phone || firebaseUser.phoneNumber || "",
    method: data.method || "phone",
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", firebaseUser.uid), profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function submitHazardReport({ hazardType, location, coordinates, photo }) {
  const user = await ensureAuthenticated();
  let photoUrl = null;
  if (photo) {
    const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}.jpg`);
    await uploadString(fileRef, photo, "data_url", { contentType: "image/jpeg" });
    photoUrl = await getDownloadURL(fileRef);
  }
  return addDoc(collection(db, "reports"), {
    hazardType, location, coordinates,
    reportedBy: user.uid,
    photo: photoUrl,
    upvotes: 0,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function upvoteReport(reportId) {
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

export async function updateReportStatus(reportId, status) {
  await ensureAuthenticated();
  await updateDoc(doc(db, "reports", reportId), { status });
  return status;
}

export async function getReports() {
  const snapshot = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getMyReports(uid) {
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(db, "reports"), where("reportedBy", "==", uid), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function getLocalReports() { return []; }
