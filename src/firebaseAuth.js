import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./firebase";

// Reuse the single Firebase app/auth instance used by the rest of RoadSense.
// This prevents phone auth from initializing a second Firebase app with a
// different/stale configuration.
export const isFirebaseAuthConfigured = true;

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
