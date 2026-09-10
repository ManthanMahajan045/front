import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// RoadSense production Firebase web app configuration.
// These values come directly from Firebase Project Settings for road-sense-bca4e.
const firebaseConfig = {
  apiKey: "AIzaSyDrvaJONaD-CK2_W1dLkUA-NtwhFBChPkU",
  authDomain: "road-sense-bca4e.firebaseapp.com",
  projectId: "road-sense-bca4e",
  storageBucket: "road-sense-bca4e.firebasestorage.app",
  messagingSenderId: "1032531366359",
  appId: "1:1032531366359:web:4855fc7461fbb3d4c13b92",
};

export const isFirebaseAuthConfigured = true;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
let recaptchaVerifier = null;

export const sendPhoneOtp = async (phoneNumber) => {
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
