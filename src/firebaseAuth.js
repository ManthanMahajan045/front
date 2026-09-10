import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

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
