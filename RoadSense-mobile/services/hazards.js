import { getApps, getApp, initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDrvaJONaD-CK2_WldLkUA-NtwhFBChPkU",
  authDomain: "road-sense-bca4e.firebaseapp.com",
  projectId: "road-sense-bca4e",
  storageBucket: "road-sense-bca4e.firebasestorage.app",
  messagingSenderId: "1032531366359",
  appId: "1:1032531366359:web:4855fc7461fbb3d4c13b92"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function uriToBlob(uri) {
  const response = await fetch(uri);
  return response.blob();
}

export async function submitHazard({ description, hazardType, photoUri, location, reportedBy }) {
  let photoUrl = null;

  if (photoUri) {
    const blob = await uriToBlob(photoUri);
    const path = `hazard-reports/${reportedBy || "anonymous"}/${Date.now()}.jpg`;
    const snapshot = await uploadBytes(ref(storage, path), blob, { contentType: "image/jpeg" });
    photoUrl = await getDownloadURL(snapshot.ref);
  }

  return addDoc(collection(db, "reports"), {
    description: String(description || "").trim(),
    hazardType: hazardType || null,
    photo: photoUrl,
    location: location || null,
    reportedBy: reportedBy || null,
    upvotes: 0,
    status: "pending",
    createdAt: serverTimestamp()
  });
}
