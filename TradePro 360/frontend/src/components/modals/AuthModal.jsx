import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Wrench, User, HardHat, Mail, Lock, Eye, EyeOff,
  Phone, MapPin, CheckCircle2, Loader2, ArrowLeft,
  AlertCircle, Shield, BadgeCheck, Star,
} from "lucide-react";
import { signIn, signUp, supabase } from "../../services/supabaseClient";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────
const ROLE_TABS = [
  {
    id: "customer",
    label: "I'm a Customer",
    icon: User,
    desc: "Book & track home repairs",
    accent: "emerald",
  },
  {
    id: "engineer",
    label: "I'm an Engineer",
    icon: HardHat,
    desc: "Access your job dashboard",
    accent: "blue",
  },
];

const VIEW = { LOGIN: "login", SIGNUP: "signup", FORGOT: "forgot", SUCCESS: "success" };

// ── Small reusables ────────────────────────────────────────────────────────
function InputField({ label, id, type = "text", value, onChange, placeholder, icon: Icon, required, autoComplete, error, rightSlot }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-navy-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-11 ${Icon ? "pl-10" : "pl-4"} ${rightSlot ? "pr-10" : "pr-4"} text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-300 focus:ring-red-300"
              : "border-slate-200 focus:ring-emerald-400 focus:border-transparent"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ label, id, value, onChange, placeholder, autoComplete, error }) {
  const [show, setShow] = useState(false);
  return (
    <InputField
      label={label}
      id={id}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={Lock}
      autoComplete={autoComplete}
      error={error}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-slate-400 hover:text-slate-600 transition-colors min-h-0 p-0"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
}

function SubmitButton({ loading, label, accent = "emerald" }) {
  const bg = accent === "blue"
    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-400"
    : "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus-visible:ring-emerald-400";
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-white font-bold text-sm transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${bg}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
      {loading ? "Please wait…" : label}
    </button>
  );
}

function Divider({ label = "or" }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ── Customer Login Form ────────────────────────────────────────────────────
function CustomerLogin({ onSwitch, onSuccess, onForgot }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())                          e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))      e.email    = "Enter a valid email";
    if (!password)                              e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      if (
        error.message.includes("Invalid login") ||
        error.message.includes("invalid_credentials") ||
        error.message.toLowerCase().includes("invalid login credentials")
      ) {
        setErrors({ password: "Incorrect email or password" });
      } else if (
        error.message.includes("Email not confirmed") ||
        error.message.includes("email_not_confirmed")
      ) {
        setErrors({
          email:
            "Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.",
        });
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back!");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <InputField
        label="Email address" id="cust-login-email" type="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="jane@example.com" icon={Mail}
        autoComplete="email" error={errors.email} required
      />
      <PasswordField
        label="Password" id="cust-login-pw"
        value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password" autoComplete="current-password" error={errors.password}
      />
      <div className="flex justify-end">
        <button type="button" onClick={onForgot}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors min-h-0 p-0">
          Forgot password?
        </button>
      </div>
      <SubmitButton loading={loading} label="Sign In to My Account" accent="emerald" />
      <Divider />
      <p className="text-center text-sm text-slate-500">
        New to TradePro 360?{" "}
        <button type="button" onClick={onSwitch}
          className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors min-h-0 p-0">
          Create free account
        </button>
      </p>
    </form>
  );
}

// ── Customer Sign Up Form ──────────────────────────────────────────────────
function CustomerSignUp({ onSwitch, onSuccess }) {
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "", postcode: "" });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                         e.name     = "Full name is required";
    if (!form.email.trim())                                        e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))                    e.email    = "Enter a valid email";
    if (!form.password)                                            e.password = "Password is required";
    else if (form.password.length < 8)                             e.password = "Min 8 characters";
    if (form.confirm !== form.password)                            e.confirm  = "Passwords do not match";
    if (form.postcode && !/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(form.postcode.trim()))
                                                                   e.postcode = "Enter a valid UK postcode";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await signUp(form.email.trim().toLowerCase(), form.password, {
      full_name: form.name.trim(),
      role: "customer",
      postcode: form.postcode.trim().toUpperCase(),
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        setErrors({ email: "An account with this email already exists. Try signing in instead." });
      } else {
        toast.error(error.message);
      }
      return;
    }
    // If session is returned immediately, email confirmation is disabled — log in directly
    if (data?.session) {
      toast.success("Account created! You are now signed in.");
      onSuccess?.();
    } else {
      // Email confirmation required
      toast.success("Account created! Please check your email and click the confirmation link, then sign in.", { duration: 6000 });
      onSwitch(); // Switch to login view
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <InputField label="Full name" id="cust-su-name" value={form.name}
        onChange={(e) => update("name", e.target.value)} placeholder="Jane Smith"
        icon={User} autoComplete="name" error={errors.name} required />
      <InputField label="Email address" id="cust-su-email" type="email" value={form.email}
        onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com"
        icon={Mail} autoComplete="email" error={errors.email} required />
      <InputField label="UK Postcode" id="cust-su-pc" value={form.postcode}
        onChange={(e) => update("postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA"
        icon={MapPin} autoComplete="postal-code" error={errors.postcode} />
      <PasswordField label="Password" id="cust-su-pw" value={form.password}
        onChange={(e) => update("password", e.target.value)} placeholder="Min 8 characters"
        autoComplete="new-password" error={errors.password} />
      <PasswordField label="Confirm password" id="cust-su-cpw" value={form.confirm}
        onChange={(e) => update("confirm", e.target.value)} placeholder="Repeat password"
        autoComplete="new-password" error={errors.confirm} />
      <p className="text-[11px] text-slate-400 leading-relaxed">
        By signing up you agree to our{" "}
        <a href="/terms" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms</a>
        {" "}and{" "}
        <a href="/privacy" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
      </p>
      <SubmitButton loading={loading} label="Create My Account" accent="emerald" />
      <Divider />
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch}
          className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors min-h-0 p-0">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── Forgot Password Form ───────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-navy-900 text-base mb-1">Check your inbox</p>
          <p className="text-sm text-slate-500">
            We sent a reset link to <strong>{email}</strong>. It expires in 60 minutes.
          </p>
        </div>
        <button type="button" onClick={onBack}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 mx-auto transition-colors min-h-0 p-0">
          <ArrowLeft size={14} /> Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="text-center mb-2">
        <p className="font-bold text-navy-900 text-base mb-1">Reset your password</p>
        <p className="text-sm text-slate-500">We'll email you a secure reset link.</p>
      </div>
      <InputField
        label="Email address" id="forgot-email" type="email"
        value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
        placeholder="jane@example.com" icon={Mail}
        autoComplete="email" error={error} required
      />
      <SubmitButton loading={loading} label="Send Reset Link" accent="emerald" />
      <button type="button" onClick={onBack}
        className="w-full text-sm text-slate-500 hover:text-navy-900 flex items-center justify-center gap-1.5 py-1 transition-colors min-h-0">
        <ArrowLeft size={13} /> Back to sign in
      </button>
    </form>
  );
}

// ── Engineer Login Form ────────────────────────────────────────────────────
function EngineerLogin({ onSuccess }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())                          e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))      e.email    = "Enter a valid email";
    if (!password)                              e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await signIn(email.trim().toLowerCase(), password);
    if (error) {
      setLoading(false);
      if (error.message.includes("Invalid login")) {
        setErrors({ password: "Incorrect email or password" });
      } else {
        toast.error(error.message);
      }
      return;
    }
    // Verify the signed-in user has the engineer role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    setLoading(false);
    if (profile && profile.role !== "engineer" && profile.role !== "admin") {
      await supabase.auth.signOut();
      toast.error("This portal is for engineers only. Please use the customer login.");
      return;
    }
    toast.success("Welcome back, Engineer!");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Distinction callout */}
      <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Shield size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Engineer accounts are created by TradePro admins. Contact{" "}
          <a href="mailto:ops@tradepro360.com" className="underline font-semibold">
            ops@tradepro360.com
          </a>{" "}
          to request access.
        </p>
      </div>
      <InputField
        label="Work email" id="eng-login-email" type="email"
        value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="dave@tradepro360.com" icon={Mail}
        autoComplete="email" error={errors.email} required
      />
      <PasswordField
        label="Password" id="eng-login-pw"
        value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password" autoComplete="current-password" error={errors.password}
      />
      <SubmitButton loading={loading} label="Sign In to Engineer Portal" accent="blue" />
      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {[
          { icon: BadgeCheck, label: "Gas Safe Verified" },
          { icon: Star,       label: "Rated Engineers"   },
          { icon: Shield,     label: "Secure Portal"     },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1 text-[10px] text-slate-400">
            <Icon size={11} className="text-blue-400" /> {label}
          </div>
        ))}
      </div>
    </form>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen({ role, onClose }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 size={32} className="text-emerald-500" />
      </div>
      <div>
        <p className="font-bold text-navy-900 text-lg mb-1">You're signed in!</p>
        <p className="text-sm text-slate-500">
          {role === "engineer"
            ? "Redirecting to your Engineer Portal…"
            : "Welcome back to TradePro 360."}
        </p>
      </div>
      <button
        onClick={onClose}
        className="mx-auto flex items-center justify-center gap-2 px-8 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors min-h-0"
      >
        Continue
      </button>
    </div>
  );
}

// ── Main AuthModal ─────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose }) {
  const [role,    setRole]    = useState("customer"); // "customer" | "engineer"
  const [view,    setView]    = useState(VIEW.LOGIN);  // login | signup | forgot | success
  const overlayRef            = useRef(null);

  // Reset to login screen when modal opens
  useEffect(() => {
    if (isOpen) { setView(VIEW.LOGIN); setRole("customer"); }
  }, [isOpen]);

  // Trap focus & handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSuccess = useCallback(() => {
    setView(VIEW.SUCCESS);
    // Auto-close after 2 s
    setTimeout(() => onClose(), 2000);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  const isCustomer = role === "customer";
  const accentRing = isCustomer ? "ring-emerald-400" : "ring-blue-400";
  const accentBg   = isCustomer ? "bg-emerald-500"   : "bg-blue-600";

  const heading = {
    [VIEW.LOGIN]:  isCustomer ? "Welcome Back" : "Engineer Sign In",
    [VIEW.SIGNUP]: "Create Your Account",
    [VIEW.FORGOT]: "Reset Password",
    [VIEW.SUCCESS]:"",
  }[view];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">

        {/* ── Decorative top band ── */}
        <div className={`h-1.5 w-full ${accentBg} flex-shrink-0`} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                TradePro 360
              </p>
              <p className="font-bold text-navy-900 text-base leading-tight">
                {view === VIEW.SUCCESS ? "You're in!" : "Welcome"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy-900 transition-colors min-h-0 flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Role tabs (hidden on success/forgot) ── */}
        {view !== VIEW.SUCCESS && view !== VIEW.FORGOT && (
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
              {ROLE_TABS.map((tab) => {
                const active = role === tab.id;
                const Icon   = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setRole(tab.id); setView(VIEW.LOGIN); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-0 ${
                      active
                        ? `bg-white shadow-sm ${tab.accent === "blue" ? "text-blue-700" : "text-emerald-700"}`
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Sub-label */}
            <p className="text-center text-xs text-slate-400 mt-2">
              {ROLE_TABS.find((t) => t.id === role)?.desc}
            </p>
          </div>
        )}

        {/* ── View heading ── */}
        {view !== VIEW.SUCCESS && (
          <div className="px-6 pb-3 flex-shrink-0">
            <h2 className="text-xl font-bold text-navy-900">{heading}</h2>
            {view === VIEW.LOGIN && (
              <p className="text-sm text-slate-400 mt-0.5">
                {isCustomer
                  ? "Sign in to manage your bookings and track engineers."
                  : "Access your live job dispatch and earnings dashboard."}
              </p>
            )}
          </div>
        )}

        {/* ── Scrollable form area ── */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {view === VIEW.SUCCESS && (
            <SuccessScreen role={role} onClose={onClose} />
          )}
          {view === VIEW.FORGOT && (
            <ForgotPassword onBack={() => setView(VIEW.LOGIN)} />
          )}
          {view !== VIEW.SUCCESS && view !== VIEW.FORGOT && isCustomer && (
            <>
              {view === VIEW.LOGIN  && <CustomerLogin  onSwitch={() => setView(VIEW.SIGNUP)} onSuccess={handleSuccess} onForgot={() => setView(VIEW.FORGOT)} />}
              {view === VIEW.SIGNUP && <CustomerSignUp onSwitch={() => setView(VIEW.LOGIN)}  onSuccess={handleSuccess} />}
            </>
          )}
          {view !== VIEW.SUCCESS && view !== VIEW.FORGOT && !isCustomer && (
            <EngineerLogin onSuccess={handleSuccess} />
          )}
        </div>

        {/* ── Footer trust strip ── */}
        {view !== VIEW.SUCCESS && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4 flex-shrink-0">
            {[
              { icon: Shield,     label: "256-bit SSL"     },
              { icon: BadgeCheck, label: "Verified Trades"  },
              { icon: Star,       label: "4.9★ Rated"       },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Icon size={11} className="text-emerald-400" /> {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
