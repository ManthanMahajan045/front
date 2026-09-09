import { useState } from "react";
import { Apple, ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

const AUTH_KEY = "roadsense-auth";
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

const isValidEmail = (value) => {
  const email = value.trim();
  if (!EMAIL_REGEX.test(email)) return false;
  if (email.includes("..")) return false;
  const [local, domain] = email.split("@");
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  return true;
};

const isValidIndianPhone = (value) => {
  const digits = value.replace(/\D/g, "");
  if (!INDIAN_MOBILE_REGEX.test(digits)) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  return true;
};

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (method === "email" && !isValidEmail(email)) return setError("Enter a valid email address, for example name@gmail.com.");
    if (method === "phone" && !isValidIndianPhone(phone)) return setError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
    if (method === "email" && password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "signup" && !name.trim()) return setError("Enter your name.");
    if (method === "phone" && !otpSent) return setOtpSent(true);
    if (method === "phone" && otp.length !== 6) return setError("Enter the 6-digit OTP.");
    const user = { name: name.trim() || email.split("@")[0] || "RoadSense user", email: email.trim(), phone: phone.trim(), method };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    onAuthenticated(user);
  };

  const switchMethod = (next) => { setMethod(next); setError(""); setOtpSent(false); setOtp(""); };
  const switchMode = (next) => { setMode(next); setError(""); setOtpSent(false); };

  return (
    <main className="auth-screen">
      <style>{`
        .auth-screen .auth-brand strong,.auth-screen .auth-brand span,.auth-screen .auth-form label > span,.auth-screen .auth-switch,.auth-screen .auth-legal,.auth-screen .auth-methods button,.auth-screen .auth-input input,.auth-screen .auth-socials button { opacity: 1 !important; filter: none !important; mix-blend-mode: normal !important; }
        .auth-screen .auth-brand strong { display:block !important; position:relative !important; z-index:50 !important; color:#7c3aed !important; -webkit-text-fill-color:#7c3aed !important; opacity:1 !important; visibility:visible !important; text-shadow:0 2px 14px rgba(124,58,237,.16) !important; font-size:38px !important; font-weight:850 !important; line-height:1.15 !important; letter-spacing:-1.4px !important; margin:10px 0 7px !important; }
        .auth-screen .auth-brand span { color: var(--muted) !important; -webkit-text-fill-color: var(--muted) !important; }
        .auth-screen .auth-form label > span { color: var(--text) !important; -webkit-text-fill-color:var(--text) !important; }
        .auth-screen .auth-input { color: var(--text) !important; opacity: 1 !important; }
        .auth-screen .auth-input input { color: var(--text) !important; -webkit-text-fill-color: var(--text) !important; }
        .auth-screen .auth-input input::placeholder,.auth-screen .auth-otp::placeholder { color: #6b7280 !important; opacity: 1 !important; -webkit-text-fill-color: #6b7280 !important; }
        .auth-screen .auth-methods { background: #6d28d9 !important; }
        .auth-screen .auth-methods button { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; background: transparent !important; }
        .auth-screen .auth-methods button.active { background: #5b21b6 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; box-shadow: 0 3px 10px rgba(0,0,0,.18) !important; }
        .auth-screen .auth-form { min-height: 190px !important; align-content: start !important; }
        .auth-screen .auth-phone-row { width: 100% !important; max-width: 100% !important; min-width: 0 !important; min-height: 50px !important; grid-template-columns: minmax(0,1fr) 112px !important; overflow: hidden !important; }
        .auth-screen .auth-phone-row .auth-input.country { width: 100% !important; min-width: 0 !important; }
        .auth-screen .auth-phone-row .auth-input.country input { min-width: 0 !important; width: 100% !important; }
        .auth-screen .auth-phone-row .auth-secondary { width: 100% !important; min-width: 0 !important; }
        .auth-screen .auth-switch { color: var(--text) !important; -webkit-text-fill-color:var(--text) !important; opacity:1 !important; visibility:visible !important; display:block !important; position:relative !important; z-index:20 !important; filter:none !important; mix-blend-mode:normal !important; }
        .auth-screen .auth-switch .auth-switch-text { color: var(--text) !important; -webkit-text-fill-color:var(--text) !important; opacity:1 !important; visibility:visible !important; }
        .auth-screen .auth-switch button { color: #6d28d9 !important; -webkit-text-fill-color:#6d28d9 !important; opacity:1 !important; visibility:visible !important; font-weight:700 !important; }
        .auth-screen .auth-legal { color: var(--muted) !important; }
        :root[data-theme="dark"] .auth-screen .auth-input input { caret-color:#ffffff !important; }
        :root[data-theme="dark"] .auth-screen .auth-input,:root[data-theme="dark"] .auth-screen .auth-otp { background:#18181b !important; color:#ffffff !important; border-color:#3f3f46 !important; }
        :root[data-theme="dark"] .auth-screen .auth-input svg { color:#d4d4d8 !important; }
        :root[data-theme="dark"] .auth-screen .auth-input.country b { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
        :root[data-theme="dark"] .auth-screen .auth-secondary,:root[data-theme="dark"] .auth-screen .auth-socials button { background:#18181b !important; color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; border-color:#52525b !important; }
        :root[data-theme="dark"] .auth-screen input:-webkit-autofill,:root[data-theme="dark"] .auth-screen input:-webkit-autofill:hover,:root[data-theme="dark"] .auth-screen input:-webkit-autofill:focus { -webkit-text-fill-color:#ffffff !important; -webkit-box-shadow:0 0 0 1000px #18181b inset !important; caret-color:#ffffff !important; }
        :root:not([data-theme="dark"]) .auth-screen .auth-input input,:root:not([data-theme="dark"]) .auth-screen .auth-otp { color:#111111 !important; -webkit-text-fill-color:#111111 !important; caret-color:#111111 !important; }
        :root:not([data-theme="dark"]) .auth-screen input:-webkit-autofill,:root:not([data-theme="dark"]) .auth-screen input:-webkit-autofill:hover,:root:not([data-theme="dark"]) .auth-screen input:-webkit-autofill:focus { -webkit-text-fill-color:#111111 !important; -webkit-box-shadow:0 0 0 1000px #ffffff inset !important; caret-color:#111111 !important; }
      `}</style>
      <section className="auth-card" aria-label={mode === "login" ? "Log in to RoadSense" : "Create a RoadSense account"}>
        {mode === "signup" && <button className="auth-back" type="button" onClick={() => switchMode("login")} aria-label="Back to login"><ArrowLeft size={19} /></button>}
        <div className="auth-brand"><strong>RoadSense</strong><span>See the road ahead, travel safer</span></div>
        <div className="auth-methods" role="tablist" aria-label="Login method">
          <button type="button" className={method === "email" ? "active" : ""} onClick={() => switchMethod("email")} role="tab" aria-selected={method === "email"}>Email</button>
          <button type="button" className={method === "phone" ? "active" : ""} onClick={() => switchMethod("phone")} role="tab" aria-selected={method === "phone"}>Phone</button>
        </div>
        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === "signup" && <label><span>Full name</span><div className="auth-input"><UserRound size={17} /><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" /></div></label>}
          {method === "email" ? <>
            <label><span>Email address</span><div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@email.com" /></div></label>
            <label><span>Password</span><div className="auth-input"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" /><button type="button" className="auth-icon-button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {mode === "login" && <button type="button" className="auth-forgot" onClick={() => setError("Password reset is available once Firebase Authentication is connected.")}>Forgot password?</button>}
          </> : <>
            <label><span>Mobile number</span><div className="auth-phone-row"><div className="auth-input country"><Phone size={17} /><b>+91</b><input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} autoComplete="tel" placeholder="Mobile number" /></div><button type="button" className="auth-secondary" onClick={() => { if (isValidIndianPhone(phone)) setOtpSent(true); else setError("Enter a valid 10-digit Indian mobile number first."); }}>{otpSent ? "Sent" : "Send OTP"}</button></div></label>
            {otpSent && <label><span>Enter OTP</span><input className="auth-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" autoComplete="one-time-code" /><small>Demo OTP: enter any 6 digits</small></label>}
          </>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-primary" type="submit">{mode === "login" ? (method === "phone" ? "Verify and log in" : "Log in") : "Create account"}</button>
        </form>
        {mode === "login" && <>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-socials"><button type="button" onClick={() => setError("Google sign-in will activate when Firebase Authentication is connected.")}>Google</button><button type="button" onClick={() => setError("Apple sign-in will activate when Firebase Authentication is connected.")}><Apple size={16} /> Apple</button></div>
        </>}
        <p className="auth-switch"><span className="auth-switch-text">Don’t have an account?</span>{" "}<button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Log in"}</button></p>
        <p className="auth-legal">By continuing, you agree to RoadSense's Terms and Privacy Policy.</p>
      </section>
    </main>
  );
}
