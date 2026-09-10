import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, runTransaction, updateDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

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
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    let unsubscribe = () => {};
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      unsubscribe();
      callback(value);
    };
    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) finish(resolve, user);
      else finish(reject, new Error("Your Firebase session is missing. Please log in again before submitting a report."));
    }, (error) => finish(reject, error));
    timer = window.setTimeout(() => finish(reject, new Error("Firebase session is still loading. Please wait a moment and try again.")), 5000);
  });
}

async function sendPasswordReset(email) { return sendPasswordResetEmail(auth, email.trim()); }

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

export async function resetPasswordWithEmail(email) { return sendPasswordReset(email); }

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const profile = await saveUserProfile(result.user, { name: result.user.displayName || "RoadSense user", email: result.user.email || "", method: "google" });
  return { user: result.user, profile };
}

export async function saveUserProfile(firebaseUser, data = {}) {
  if (!firebaseUser) return null;
  const profile = { uid: firebaseUser.uid, name: data.name?.trim() || firebaseUser.displayName || "RoadSense user", email: data.email || firebaseUser.email || "", phone: data.phone || firebaseUser.phoneNumber || "", method: data.method || "phone", updatedAt: serverTimestamp() };
  await setDoc(doc(db, "users", firebaseUser.uid), profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

function compressPhotoForFirestore(dataUrl) {
  if (!dataUrl || typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return resolve(null);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.62;
      let output = canvas.toDataURL("image/jpeg", quality);
      while (output.length > 700000 && quality > 0.28) { quality -= 0.08; output = canvas.toDataURL("image/jpeg", quality); }
      resolve(output);
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

export async function submitHazardReport({ hazardType, location, coordinates, photo }) {
  const user = await ensureAuthenticated();
  const compactPhoto = photo ? await compressPhotoForFirestore(photo) : null;
  let photoUrl = null;
  let photoData = null;

  if (compactPhoto) {
    try {
      const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}.jpg`);
      await uploadString(fileRef, compactPhoto, "data_url", { contentType: "image/jpeg" });
      photoUrl = await getDownloadURL(fileRef);
    } catch (error) {
      // If Storage is unavailable, keep the compact image in Firestore so the
      // report still contains both details and a photo. The original image is
      // never written to Firestore.
      console.warn("Storage upload unavailable; using Firestore photo fallback.", error);
      photoData = compactPhoto;
    }
  }

  return addDoc(collection(db, "reports"), {
    hazardType, location, coordinates, reportedBy: user.uid,
    photo: photoUrl, photoData, upvotes: 0, status: "pending", createdAt: serverTimestamp(),
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
  // Avoid a required composite index for where(reportedBy) + orderBy(createdAt).
  // We sort the user's small report list in memory instead.
  const snapshot = await getDocs(query(collection(db, "reports"), where("reportedBy", "==", uid)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

export function getLocalReports() { return []; }
