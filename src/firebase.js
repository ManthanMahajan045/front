import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, runTransaction, updateDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// RoadSense production Firebase web app configuration from Firebase Console.
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error("Your Firebase session is missing. Please log in again before submitting a report."));
    }, (error) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(error);
    });
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(new Error("Firebase session is still loading. Please wait a moment and try again."));
    }, 5000);
  });
}

async function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email.trim());
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

export async function resetPasswordWithEmail(email) {
  return sendPasswordReset(email);
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
  let photoUploadWarning = null;

  // Cloud Storage currently requires the Firebase Blaze plan. Keep report
  // submission working on Spark by treating the photo as optional: if storage
  // is unavailable, the hazard report itself is still saved to Firestore.
  if (photo) {
    try {
      const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}.jpg`);
      await uploadString(fileRef, photo, "data_url", { contentType: "image/jpeg" });
      photoUrl = await getDownloadURL(fileRef);
    } catch (error) {
      console.warn("Photo upload skipped; report will still be submitted.", error);
      photoUploadWarning = error?.code || "photo-upload-failed";
    }
  }

  const reportRef = await addDoc(collection(db, "reports"), {
    hazardType,
    location,
    coordinates,
    reportedBy: user.uid,
    photo: photoUrl,
    upvotes: 0,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return { ...reportRef, photoUploadWarning };
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
