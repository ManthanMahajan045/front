import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, signInWithEmail } from "../firebase";

const AUTH_KEY = "roadsense-auth";

const getAuthError = (error) => {
  const code = error?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("operation-not-allowed")) return "Email/password sign-in is not enabled in Firebase yet.";
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
        <p className="auth-legal">Access is checked using Firebase authority roles/custom claims.</p>
      </section>
      <style>{`.authority-auth-screen{background:radial-gradient(ellipse at 50% 0%,#f5f0ff 0%,var(--surface) 54%);padding:28px 22px}
.authority-auth-screen .authority-auth-card{position:relative;max-width:390px;padding:24px 0 28px}
.authority-auth-screen .auth-back{position:absolute;top:0;left:0;width:42px;height:42px;border-radius:14px;background:var(--surface-2);color:var(--text);border:1px solid var(--border)}
.authority-auth-screen .auth-brand{margin:18px 0 28px;text-align:center}
.authority-auth-screen .auth-brand:before{width:76px;height:76px;border-radius:22px;margin-bottom:14px;box-shadow:0 8px 22px rgba(109,40,217,.18)}
.authority-auth-screen .authority-shield{width:62px;height:62px;border-radius:19px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;background:var(--primary-soft);color:var(--primary)}
.authority-auth-screen .auth-brand strong{color:var(--text);font-family:inherit;font-style:normal;font-size:clamp(27px,7vw,32px);font-weight:780;letter-spacing:-1.1px;line-height:1.15}
.authority-auth-screen .auth-brand span{color:var(--muted);font-size:13px;line-height:1.5;margin:8px auto 0;max-width:320px}
.authority-auth-screen .authority-notice{display:flex;align-items:center;gap:11px;padding:14px 15px;margin:0 0 26px;color:var(--primary);background:var(--primary-soft);border:1px solid color-mix(in srgb,var(--primary) 18%,transparent);border-radius:14px;font-size:13px;font-weight:600;line-height:1.5}
.authority-auth-screen .authority-notice svg{flex:0 0 auto}
.authority-auth-screen .auth-form{gap:19px}
.authority-auth-screen .auth-form label{gap:8px;font-size:13px;font-weight:600}
.authority-auth-screen .auth-form label>span{color:var(--text);font-weight:650}
.authority-auth-screen .auth-input{min-height:54px;padding:0 14px;border-radius:13px;background:var(--surface-2);border-color:var(--border);gap:11px}
.authority-auth-screen .auth-input svg{color:var(--muted)}
.authority-auth-screen .auth-input input{color:var(--text);font-size:14px}
.authority-auth-screen .auth-input:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 14%,transparent)}
.authority-auth-screen .auth-primary{height:54px;margin-top:3px;border-radius:14px;background:linear-gradient(100deg,#6d28d9,#7c3aed);color:#fff;font-size:15px;font-weight:750;box-shadow:0 8px 18px rgba(109,40,217,.2)}
.authority-auth-screen .auth-primary:hover{background:linear-gradient(100deg,#5b21b6,#6d28d9)}
.authority-auth-screen .auth-primary:disabled{opacity:.65;box-shadow:none}
.authority-auth-screen .auth-legal{max-width:330px;margin:20px auto 0;color:var(--muted);font-size:11px;line-height:1.55}
:root[data-theme="dark"] .authority-auth-screen{background:radial-gradient(ellipse at 50% 0%,#21143b 0%,#0b1020 54%,#0b1020 100%)}
:root[data-theme="dark"] .authority-auth-screen .auth-back{background:#24243d;border-color:#343452;color:#f4f0ff}
:root[data-theme="dark"] .authority-auth-screen .authority-shield{background:#292044;color:#b69aff}
:root[data-theme="dark"] .authority-auth-screen .authority-notice{background:#201936;border-color:#48316f;color:#c4a8ff}
:root[data-theme="dark"] .authority-auth-screen .auth-input{background:#191d30;border-color:#3b4564}
:root[data-theme="dark"] .authority-auth-screen .auth-input input{color:#f8fafc}
:root[data-theme="dark"] .authority-auth-screen .auth-input input::placeholder{color:#8992ad}
:root[data-theme="dark"] .authority-auth-screen .auth-primary{box-shadow:0 8px 22px rgba(109,40,217,.28)}
@media(max-width:380px){.authority-auth-screen{padding:22px 18px}.authority-auth-screen .authority-auth-card{padding-top:18px}.authority-auth-screen .auth-brand{margin:16px 0 24px}.authority-auth-screen .authority-notice{margin-bottom:22px}}
@media(max-height:700px){.authority-auth-screen{align-items:flex-start}.authority-auth-screen .authority-auth-card{margin:auto 0}}`}</style>
    </main>
  );
}
