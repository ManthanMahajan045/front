import { useState } from "react";
import { Apple, ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

const AUTH_KEY = "roadsense-auth";

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
    if (method === "email" && !email.trim()) return setError("Enter your email address.");
    if (method === "phone" && phone.replace(/\D/g, "").length < 10) return setError("Enter a valid 10-digit mobile number.");
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
        .auth-screen .auth-brand strong { color: #111111 !important; -webkit-text-fill-color: #111111 !important; opacity: 1 !important; text-shadow: none !important; }
        .auth-screen .auth-brand span { color: #6b7280 !important; -webkit-text-fill-color: #6b7280 !important; }
        .auth-screen .auth-form label > span { color: #111111 !important; -webkit-text-fill-color: #111111 !important; }
        .auth-screen .auth-input { color: #111111 !important; opacity: 1 !important; }
        .auth-screen .auth-input input { color: #111111 !important; -webkit-text-fill-color: #111111 !important; }
        .auth-screen .auth-input input::placeholder,.auth-screen .auth-otp::placeholder { color: #6b7280 !important; opacity: 1 !important; -webkit-text-fill-color: #6b7280 !important; }
        .auth-screen .auth-methods { background: #6d28d9 !important; }
        .auth-screen .auth-methods button { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; background: transparent !important; }
        .auth-screen .auth-methods button.active { background: #5b21b6 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; box-shadow: 0 3px 10px rgba(0,0,0,.18) !important; }
        .auth-screen .auth-form { min-height: 190px !important; align-content: start !important; }
        .auth-screen .auth-phone-row { min-height: 50px !important; }
        .auth-screen .auth-switch { color: #111111 !important; -webkit-text-fill-color: #111111 !important; opacity: 1 !important; visibility: visible !important; display: block !important; position: relative !important; z-index: 20 !important; filter: none !important; mix-blend-mode: normal !important; }
        .auth-screen .auth-switch .auth-switch-text { color: #111111 !important; -webkit-text-fill-color: #111111 !important; opacity: 1 !important; visibility: visible !important; }
        .auth-screen .auth-switch button { color: #6d28d9 !important; -webkit-text-fill-color: #6d28d9 !important; opacity: 1 !important; visibility: visible !important; font-weight: 700 !important; }
        .auth-screen .auth-legal { color: #6b7280 !important; }
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
            <label><span>Mobile number</span><div className="auth-phone-row"><div className="auth-input country"><Phone size={17} /><b>+91</b><input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} autoComplete="tel" placeholder="Mobile number" /></div><button type="button" className="auth-secondary" onClick={() => { if (phone.replace(/\D/g, "").length >= 10) setOtpSent(true); else setError("Enter your 10-digit mobile number first."); }}>{otpSent ? "Sent" : "Send OTP"}</button></div></label>
            {otpSent && <label><span>Enter OTP</span><input className="auth-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •" autoComplete="one-time-code" /><small>Demo OTP: enter any 6 digits</small></label>}
          </>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-primary" type="submit">{mode === "login" ? (method === "phone" ? "Verify and log in" : "Log in") : "Create account"}</button>
        </form>
        {mode === "login" && <>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-socials"><button type="button" onClick={() => setError("Google sign-in will activate when Firebase Authentication is connected.")}>Google</button><button type="button" onClick={() => setError("Apple sign-in will activate when Firebase Authentication is connected.")}><Apple size={16} /> Apple</button></div>
        </>}
        <p className="auth-switch" style={{ opacity: 1, visibility: "visible", display: "block", position: "relative", zIndex: 20, marginTop: 12, marginBottom: 8, color: "#111111", WebkitTextFillColor: "#111111", filter: "none", mixBlendMode: "normal" }}><span className="auth-switch-text" style={{ color: "#111111", WebkitTextFillColor: "#111111", opacity: 1, visibility: "visible" }}>Don’t have an account?</span>{" "}<button type="button" style={{ color: "#6d28d9", WebkitTextFillColor: "#6d28d9", opacity: 1, visibility: "visible", fontWeight: 700 }} onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Log in"}</button></p>
        <p className="auth-legal">By continuing, you agree to RoadSense's Terms and Privacy Policy.</p>
      </section>
    </main>
  );
}
