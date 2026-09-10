import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// RoadSense production Firebase web app configuration.
// Firebase web API keys are public project identifiers; authorization is
// enforced by Firebase Authentication and Security Rules.
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

export const isFirebaseAuthConfigured = requiredConfig.every(Boolean);

let auth = null;
let recaptchaVerifier = null;

if (isFirebaseAuthConfigured) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export const sendPhoneOtp = async (phoneNumber) => {
  if (!auth) throw new Error("Firebase Authentication is not configured.");

  clearRecaptcha();

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => clearRecaptcha(),
  });

  try {
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error) {
    clearRecaptcha();
    throw error;
  }
};

export const verifyPhoneOtp = async (confirmationResult, otp) => {
  if (!confirmationResult) throw new Error("OTP session is missing or expired.");
  return confirmationResult.confirm(otp);
};

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};
