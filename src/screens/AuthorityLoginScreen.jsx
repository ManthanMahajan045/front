import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, signInWithEmail, signInWithGoogle } from "../firebase";

const AUTH_KEY = "roadsense-auth";

const getAuthError = (error) => {
  const code = error?.code || "";
  if (code.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  if (code.includes("popup-blocked")) return "Your browser blocked the Google sign-in popup. Allow popups and try again.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("operation-not-allowed")) return "This sign-in method is not enabled in Firebase yet.";
  if (code.includes("unauthorized-domain")) return "This website is not authorized in Firebase Authentication.";
  return error?.message || "We could not complete authority sign-in.";
};

const persistAuthority = (firebaseUser, profile, claims) => {
  const user = {
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || "Authority",
    email: profile?.email || firebaseUser.email || "",
    method: profile?.method || "email",
    role: claims.role || "authority",
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
};

export default function AuthorityLoginScreen({ onAuthenticated, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const completeAuthorityLogin = async (result) => {
    const tokenResult = await result.user.getIdTokenResult(true);
    const claims = tokenResult.claims || {};
    if (claims.role !== "authority" && claims.authority !== true && claims.admin !== true) {
      await signOut(auth);
      throw new Error("This account is not authorized for the Authority Dashboard. Please use an approved authority account.");
    }
    onAuthenticated(persistAuthority(result.user, result.profile, claims));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) return setError("Enter a valid authority email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await completeAuthorityLogin(await signInWithEmail(email, password));
    } catch (err) {
      setError(err.message?.startsWith("This account is not authorized") ? err.message : getAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await completeAuthorityLogin(await signInWithGoogle());
    } catch (err) {
      setError(err.message?.startsWith("This account is not authorized") ? err.message : getAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen authority-auth-screen">
      <section className="auth-card authority-auth-card" aria-label="Authority login">
        <button className="auth-back" type="button" onClick={onBack} aria-label="Back to RoadSense">
          <ArrowLeft size={19} />
        </button>
        <div className="auth-brand">
          <div className="authority-shield"><ShieldCheck size={30} /></div>
          <strong>Authority Login</strong>
          <span>Secure access for authorized road authorities</span>
        </div>
        <div className="authority-notice"><ShieldCheck size={17} /><span>Only approved authority accounts can continue.</span></div>
        <form className="auth-form" onSubmit={submit} noValidate>
          <label>
            <span>Authority email</span>
            <div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="authority@department.gov" /></div>
          </label>
          <label>
            <span>Password</span>
            <div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter your password" /><button type="button" className="auth-icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-primary" type="submit" disabled={busy}>{busy ? "Verifying…" : "Sign in as authority"}</button>
        </form>
        <div className="auth-divider"><span>or continue with</span></div>
        <div className="auth-socials"><button className="auth-google" type="button" onClick={googleLogin} disabled={busy}><span className="google-mark">G</span>{busy ? "Signing in…" : "Continue with Google"}</button></div>
        <p className="auth-legal">Access is checked using Firebase authority roles/custom claims.</p>
      </section>
      <style>{`.authority-auth-screen .authority-auth-card{position:relative}.authority-auth-screen .auth-back{position:absolute;top:22px;left:22px}.authority-auth-screen .authority-shield{width:58px;height:58px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;background:#ede9fe;color:#6d28d9}.authority-auth-screen .authority-notice{display:flex;align-items:center;gap:8px;padding:12px 14px;margin:20px 0;color:#5b21b6;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;font-size:13px}.authority-auth-screen .auth-google{display:flex;align-items:center;justify-content:center;gap:9px}.authority-auth-screen .google-mark{font-weight:800;font-size:18px;color:#4285f4}.authority-auth-screen .auth-legal{text-align:center;font-size:12px;color:var(--muted);margin:18px 0 0}`}</style>
    </main>
  );
}
