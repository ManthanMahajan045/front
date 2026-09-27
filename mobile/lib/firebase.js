import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrvaJONaD-CK2_WldLkUA-NtwhFBChPkU",
  authDomain: "road-sense-bca4e.firebaseapp.com",
  projectId: "road-sense-bca4e",
  storageBucket: "road-sense-bca4e.firebasestorage.app",
  messagingSenderId: "1032531366359",
  appId: "1:1032531366359:web:4855fc7461fbb3d4c13b92"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  auth = getAuth(app);
}
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function register(email, password, name) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
  await saveUserProfile(result.user, { name: name.trim(), method: "email" });
  return result.user;
}
export async function login(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}
export async function logout() { await signOut(auth); }
export async function saveUserProfile(user, data) {
  if (!user) return;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: data.name || user.displayName || "RoadSense user",
    email: data.email || user.email || "",
    phone: data.phone || user.phoneNumber || "",
    method: data.method || "email",
    updatedAt: serverTimestamp()
  }, { merge: true });
}
export async function getSavedLocations(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() && Array.isArray(snapshot.data().savedLocations) ? snapshot.data().savedLocations : [];
}
export async function saveLocation(uid, location) {
  const current = await getSavedLocations(uid);
  const next = current.filter(function (item) { return item.id !== location.id; }).concat([location]);
  await setDoc(doc(db, "users", uid), { savedLocations: next }, { merge: true });
  return location;
}
export async function removeLocation(uid, locationId) {
  const current = await getSavedLocations(uid);
  await setDoc(doc(db, "users", uid), {
    savedLocations: current.filter(function (item) { return item.id !== locationId; })
  }, { merge: true });
}
async function uploadPhoto(uri, uid) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, "reports/" + uid + "/" + Date.now() + ".jpg");
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}
export async function submitReport(payload, uid) {
  let photoUrl = null;
  if (payload.photoUri) photoUrl = await uploadPhoto(payload.photoUri, uid);
  return addDoc(collection(db, "reports"), {
    hazardType: payload.hazardType,
    location: payload.location,
    coordinates: payload.coordinates,
    photo: photoUrl,
    photoData: null,
    reportedBy: uid,
    upvotes: 0,
    status: "pending",
    createdAt: serverTimestamp()
  });
}
export async function getReports() {
  const snapshot = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
  return snapshot.docs.map(function (item) { return Object.assign({ id: item.id }, item.data()); });
}
export async function getMyReports(uid) {
  const snapshot = await getDocs(query(collection(db, "reports"), where("reportedBy", "==", uid)));
  return snapshot.docs.map(function (item) { return Object.assign({ id: item.id }, item.data()); })
    .sort(function (a, b) {
      return (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) -
        (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0);
    });
}
export async function upvoteReport(reportId, uid) {
  const vote = doc(db, "reports", reportId, "upvotes", uid);
  const report = doc(db, "reports", reportId);
  const voteSnapshot = await getDoc(vote);
  if (voteSnapshot.exists()) throw new Error("You have already upvoted this report.");
  const reportSnapshot = await getDoc(report);
  if (!reportSnapshot.exists()) throw new Error("Report not found.");
  const next = Number(reportSnapshot.data().upvotes || 0) + 1;
  await setDoc(vote, { userId: uid, createdAt: serverTimestamp() });
  await updateDoc(report, { upvotes: next, status: next >= 3 ? "verified" : "pending" });
  return next;
}
