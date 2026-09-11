import { getApp, getApps, initializeApp } from "firebase/app";

import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { getFirestore, collection, addDoc, doc, setDoc, getDoc, runTransaction, updateDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";
 
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

export { db, auth };
 
async function ensureAuthenticated() {

  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {

    let settled = false;

    let timer;

    let unsubscribe = () => {};

    const finish = (callback, value) => { if (settled) return; settled = true; if (timer) window.clearTimeout(timer); unsubscribe(); callback(value); };

    unsubscribe = onAuthStateChanged(auth, (user) => { if (user) finish(resolve, user); else finish(reject, new Error("Your Firebase session is missing. Please log in again before submitting a report.")); }, (error) => finish(reject, error));

    timer = window.setTimeout(() => finish(reject, new Error("Firebase session is still loading. Please wait a moment and try again.")), 5000);

  });

}
 
async function sendPasswordReset(email) { return sendPasswordResetEmail(auth, email.trim()); }
 
export async function signUpWithEmail(email, password, name) {

  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

  if (name?.trim()) await updateProfile(result.user, { displayName: name.trim() });

  saveUserProfile(result.user, { name: name?.trim() || email.split("@")[0], email: result.user.email || email.trim(), method: "email" }).catch((error) => console.warn("Profile save deferred:", error));

  return result.user;

}
 
export async function signInWithEmail(email, password) {

  const result = await signInWithEmailAndPassword(auth, email.trim(), password);

  let profile = null;

  try { profile = await Promise.race([getUserProfile(result.user.uid), new Promise((resolve) => window.setTimeout(() => resolve(null), 2500))]); } catch (error) { console.warn("Profile read deferred:", error); }

  return { user: result.user, profile };

}
 
export async function resetPasswordWithEmail(email) { return sendPasswordResetEmail(auth, email.trim()); }
 
export async function signInWithGoogle() {

  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);

  const profile = { uid: result.user.uid, name: result.user.displayName || "RoadSense user", email: result.user.email || "", phone: result.user.phoneNumber || "", method: "google" };

  saveUserProfile(result.user, profile).catch((error) => console.warn("Profile save deferred:", error));

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
 
function cleanSavedLocation(location = {}) {

  const type = ["home", "work", "custom"].includes(location.type) ? location.type : "custom";

  const name = String(location.name || "").trim();

  const address = String(location.address || "").trim();

  const latitude = Number(location.latitude ?? location.coordinates?.lat);

  const longitude = Number(location.longitude ?? location.coordinates?.lng);

  if (!name) throw new Error("Please enter a name for this saved place.");

  if (!address) throw new Error("Please choose a location with an address.");

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Please choose a valid map location.");

  return { type, name, address, latitude, longitude };

}
 
function savedLocationWithCoordinates(location) { return { ...location, coordinates: { lat: location.latitude, lng: location.longitude } }; }

function makeSavedLocationId(type) { return type === "home" || type === "work" ? type : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
 
export async function getSavedLocations(uid) {

  const user = await ensureAuthenticated();

  if (!uid || uid !== user.uid) throw new Error("You can only access your own saved places.");

  const snapshot = await getDoc(doc(db, "users", user.uid));

  if (!snapshot.exists()) return [];

  const locations = Array.isArray(snapshot.data().savedLocations) ? snapshot.data().savedLocations : [];

  return locations.map(savedLocationWithCoordinates);

}
 
export async function createSavedLocation(location) {

  const user = await ensureAuthenticated();

  const data = cleanSavedLocation(location);

  const userRef = doc(db, "users", user.uid);

  const saved = await runTransaction(db, async (transaction) => {

    const snapshot = await transaction.get(userRef);

    const existing = Array.isArray(snapshot.data()?.savedLocations) ? snapshot.data().savedLocations : [];

    if ((data.type === "home" || data.type === "work") && existing.some((item) => item.type === data.type)) throw new Error(`You already have a ${data.type === "home" ? "Home" : "Work"} location. Edit the existing one instead.`);

    const next = { id: makeSavedLocationId(data.type), ...data, createdAt: Date.now(), updatedAt: Date.now() };

    transaction.set(userRef, { savedLocations: [...existing, next] }, { merge: true });

    return next;

  });

  return savedLocationWithCoordinates(saved);

}
 
export async function updateSavedLocation(locationId, location) {

  const user = await ensureAuthenticated();

  const data = cleanSavedLocation(location);

  const userRef = doc(db, "users", user.uid);

  const saved = await runTransaction(db, async (transaction) => {

    const snapshot = await transaction.get(userRef);

    const existing = Array.isArray(snapshot.data()?.savedLocations) ? snapshot.data().savedLocations : [];

    const index = existing.findIndex((item) => item.id === locationId);

    if (index < 0) throw new Error("Saved place not found.");

    if ((data.type === "home" || data.type === "work") && existing.some((item, itemIndex) => itemIndex !== index && item.type === data.type)) throw new Error(`You already have a ${data.type === "home" ? "Home" : "Work"} location. Edit that location instead.`);

    const current = existing[index];

    const next = { ...current, ...data, id: data.type === "home" || data.type === "work" ? data.type : current.id, updatedAt: Date.now() };

    const nextLocations = existing.filter((_, itemIndex) => itemIndex !== index);

    nextLocations.push(next);

    transaction.set(userRef, { savedLocations: nextLocations }, { merge: true });

    return next;

  });

  return savedLocationWithCoordinates(saved);

}
 
export async function deleteSavedLocation(locationId) {

  const user = await ensureAuthenticated();

  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {

    const snapshot = await transaction.get(userRef);

    const existing = Array.isArray(snapshot.data()?.savedLocations) ? snapshot.data().savedLocations : [];

    const next = existing.filter((item) => item.id !== locationId);

    if (next.length !== existing.length) transaction.set(userRef, { savedLocations: next }, { merge: true });

  });

}
 
function compressPhotoForFirestore(dataUrl) {

  if (!dataUrl || typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {

    const image = new Image();

    image.onload = () => { const maxSide = 640; const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round((image.naturalWidth || 1) * scale)); canvas.height = Math.max(1, Math.round((image.naturalHeight || 1) * scale)); const ctx = canvas.getContext("2d", { alpha: false }); if (!ctx) return resolve(null); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); let quality = 0.55; let output = canvas.toDataURL("image/jpeg", quality); while (output.length > 550000 && quality > 0.25) { quality -= 0.07; output = canvas.toDataURL("image/jpeg", quality); } resolve(output); };

    image.onerror = () => resolve(null); image.src = dataUrl;

  });

}
 
export async function submitHazardReport({ hazardType, location, coordinates, photo }) { const user = await ensureAuthenticated(); const photoData = photo ? await compressPhotoForFirestore(photo) : null; return addDoc(collection(db, "reports"), { hazardType, location, coordinates, reportedBy: user.uid, photo: null, photoData, upvotes: 0, status: "pending", createdAt: serverTimestamp() }); }

export async function submitFeedback({ message, category = "General", rating = null }) { const user = await ensureAuthenticated(); const cleanMessage = String(message || "").trim(); if (cleanMessage.length < 5) throw new Error("Please enter at least 5 characters of feedback."); if (cleanMessage.length > 2000) throw new Error("Feedback must be 2000 characters or less."); return addDoc(collection(db, "feedback"), { message: cleanMessage, category: String(category || "General").trim() || "General", rating: Number.isFinite(rating) ? rating : null, submittedBy: user.uid, email: user.email || "", phone: user.phoneNumber || "", createdAt: serverTimestamp() }); }

export async function upvoteReport(reportId) { await ensureAuthenticated(); const reportRef = doc(db, "reports", reportId); return runTransaction(db, async (transaction) => { const reportDoc = await transaction.get(reportRef); if (!reportDoc.exists()) throw new Error("Report not found"); const data = reportDoc.data(); const newUpvotes = (data.upvotes || 0) + 1; const status = newUpvotes >= 3 ? "verified" : "pending"; transaction.update(reportRef, { upvotes: newUpvotes, status }); return newUpvotes; }); }

export async function updateReportStatus(reportId, status) { await ensureAuthenticated(); await updateDoc(doc(db, "reports", reportId), { status }); return status; }

export async function getReports() { const snapshot = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"))); return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })); }

export async function getMyReports(uid) { if (!uid) return []; const snapshot = await getDocs(query(collection(db, "reports"), where("reportedBy", "==", uid))); return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)); }

export function getLocalReports() { return []; }
 
