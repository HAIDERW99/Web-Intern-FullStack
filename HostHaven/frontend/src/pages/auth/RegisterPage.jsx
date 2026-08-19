import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const hotelLobby = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80';

// ─── Eye toggle icon ──────────────────────────────────────────────────────
const EyeIcon = ({ show }) =>
  show ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

// ─── Password strength meter ──────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const levels = [
    { label: 'Too short',  color: 'bg-red-400' },
    { label: 'Weak',       color: 'bg-red-400' },
    { label: 'Fair',       color: 'bg-amber-400' },
    { label: 'Good',       color: 'bg-blue-400' },
    { label: 'Strong',     color: 'bg-emerald-500' },
  ];
  const { label, color } = levels[score];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? color : 'bg-[#e0e3e5]'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-blue-500' : 'text-emerald-600'}`}>
        {label}
      </p>
    </div>
  );
}

// ─── Field label component ────────────────────────────────────────────────
const Label = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#45464d] mb-1.5 tracking-wide uppercase">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

// ─── Step indicator ───────────────────────────────────────────────────────
const StepDot = ({ step, current, label }) => {
  const done    = current > step;
  const active  = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
        ${done   ? 'bg-[#fea619] text-[#2a1700]' :
          active ? 'bg-[#131b2e] text-white ring-2 ring-[#131b2e]/20' :
                   'bg-[#e0e3e5] text-[#76777d]'}`}>
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : step}
      </div>
      <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-[#191c1e]' : 'text-[#76777d]'}`}>
        {label}
      </span>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();

  // Step 1 — role selection
  const [role, setRole] = useState('');

  // Step 2 — personal details
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed]           = useState(false);

  // Step 3 — owner-specific details
  const [businessName, setBusinessName]   = useState('');
  const [hotelAddress, setHotelAddress]   = useState('');
  const [city, setCity]                   = useState('');
  const [country, setCountry]             = useState('');
  const [numRooms, setNumRooms]           = useState('');
  const [category, setCategory]           = useState('');

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const totalSteps = role === 'hotel_owner' ? 3 : 2;

  // ─── Validation ───────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'A valid email address is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!agreed) return 'You must agree to the Terms & Privacy Policy.';
    return null;
  };

  const validateStep3 = () => {
    if (!businessName.trim()) return 'Business / hotel name is required.';
    if (!hotelAddress.trim()) return 'Hotel address is required.';
    if (!city.trim()) return 'City is required.';
    if (!country.trim()) return 'Country is required.';
    if (!numRooms || Number(numRooms) < 1) return 'Number of rooms must be at least 1.';
    if (!category) return 'Please select a hotel category.';
    return null;
  };

  // ─── Navigation ───────────────────────────────────────────────────────
  const goNext = () => {
    setError('');
    if (step === 1) {
      if (!role) { setError('Please select your account type to continue.'); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      if (role === 'hotel_owner') { setStep(3); return; }
      handleSubmit();
    } else if (step === 3) {
      const err = validateStep3();
      if (err) { setError(err); return; }
      handleSubmit();
    }
  };

  const goBack = () => { setError(''); setStep((s) => s - 1); };

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const metadata = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
        ...(role === 'hotel_owner' && {
          business_name: businessName.trim(),
          hotel_address: hotelAddress.trim(),
          city: city.trim(),
          country: country.trim(),
          num_rooms: Number(numRooms),
          category,
        }),
      };

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: metadata },
      });

      if (signUpError) { setError(signUpError.message); return; }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // ─── Success screen ───────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img src={hotelLobby} alt="Luxury hotel" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-[#0a0f1e]/20 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end p-10 pb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#fea619] text-3xl select-none">hotel_class</span>
              <span className="text-white font-bold text-2xl tracking-tight">HostHaven</span>
            </div>
            <p className="text-white/80 text-base max-w-xs leading-relaxed">
              Elevate your hospitality experience. Seamlessly manage bookings, staff, and properties from one central hub.
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#191c1e] mb-2">Account Created!</h1>
            <p className="text-sm text-[#45464d] mb-2">
              We've sent a verification email to <strong className="text-[#191c1e]">{email}</strong>.
            </p>
            <p className="text-sm text-[#45464d] mb-8">
              Please check your inbox and click the link to verify your account before signing in.
            </p>
            {role === 'hotel_owner' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">📋 Next Step for Hotel Owners</p>
                <p className="text-xs text-amber-700">
                  After email verification, your property registration will be reviewed by our admin team within 24–48 hours. You'll receive a notification once approved.
                </p>
              </div>
            )}
            <button
              onClick={() => navigate('/login')}
              className="btn-gold"
            >
              Go to Sign In
            </button>
            <p className="text-xs text-[#76777d] mt-4">Didn't receive the email? Check your spam folder.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel — Hero ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={hotelLobby} alt="Luxury hotel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-[#0a0f1e]/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-10 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#fea619] text-3xl select-none">hotel_class</span>
            <span className="text-white font-bold text-2xl tracking-tight">HostHaven</span>
          </div>
          <p className="text-white/80 text-base max-w-xs leading-relaxed">
            Elevate your hospitality experience. Seamlessly manage bookings, staff, and properties from one central hub.
          </p>
          {/* Feature list */}
          <ul className="mt-6 space-y-2">
            {[
              'Book from 500+ verified properties',
              'Real-time availability & instant confirmation',
              'Dedicated owner dashboard & analytics',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                <svg className="w-4 h-4 text-[#fea619] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right Panel — Form ────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-4">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <span className="material-symbols-outlined text-[#fea619] text-2xl">hotel_class</span>
            <span className="font-bold text-xl text-[#131b2e]">HostHaven</span>
          </div>

          {/* ── Step indicator ── */}
          <div className="flex items-center gap-0 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <StepDot
                  step={s}
                  current={step}
                  label={s === 1 ? 'Account Type' : s === 2 ? 'Your Details' : 'Property Info'}
                />
                {idx < totalSteps - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${step > s ? 'bg-[#fea619]' : 'bg-[#e0e3e5]'}`} />
                )}
              </div>
            ))}
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* STEP 1 — Account type                                  */}
          {/* ══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-1">Create an Account</h1>
              <p className="text-sm text-[#45464d] mb-7">Choose how you'd like to use HostHaven.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Guest card */}
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer text-left
                    ${role === 'customer'
                      ? 'border-[#131b2e] bg-[#f7f9fb] ring-2 ring-[#131b2e]/10'
                      : 'border-[#e0e3e5] hover:border-[#c6c6cd] bg-white'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors
                    ${role === 'customer' ? 'bg-[#131b2e]' : 'bg-[#f2f4f6]'}`}>
                    🧳
                  </div>
                  <div>
                    <p className="font-semibold text-[#191c1e] text-sm">Guest</p>
                    <p className="text-xs text-[#76777d] mt-0.5 leading-snug">Browse and book hotels, manage reservations</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-auto transition-colors
                    ${role === 'customer' ? 'border-[#131b2e] bg-[#131b2e]' : 'border-[#c6c6cd]'}`}>
                    {role === 'customer' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Owner card */}
                <button
                  type="button"
                  onClick={() => setRole('hotel_owner')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer text-left
                    ${role === 'hotel_owner'
                      ? 'border-[#fea619] bg-[#fffbf2] ring-2 ring-[#fea619]/20'
                      : 'border-[#e0e3e5] hover:border-[#c6c6cd] bg-white'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors
                    ${role === 'hotel_owner' ? 'bg-[#fea619]' : 'bg-[#f2f4f6]'}`}>
                    🏨
                  </div>
                  <div>
                    <p className="font-semibold text-[#191c1e] text-sm">Hotel Owner</p>
                    <p className="text-xs text-[#76777d] mt-0.5 leading-snug">List properties, manage bookings & earnings</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-auto transition-colors
                    ${role === 'hotel_owner' ? 'border-[#fea619] bg-[#fea619]' : 'border-[#c6c6cd]'}`}>
                    {role === 'hotel_owner' && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>

              <button type="button" onClick={goNext} className="btn-gold">
                Continue
              </button>

              {/* OAuth */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#e0e3e5]" />
                <span className="text-xs text-[#76777d] font-medium">Or sign up with</span>
                <div className="flex-1 h-px bg-[#e0e3e5]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleGoogleSignUp}
                  className="btn-outline flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button type="button" disabled title="Apple sign-up coming soon"
                  className="btn-outline flex items-center justify-center gap-2 text-sm opacity-60 cursor-not-allowed">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>

              <p className="text-center text-sm text-[#45464d] mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3980f4] font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* STEP 2 — Personal details                              */}
          {/* ══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-1">Your Details</h1>
              <p className="text-sm text-[#45464d] mb-7">
                {role === 'hotel_owner'
                  ? 'Create your owner account — property details come next.'
                  : 'Set up your guest account to start booking.'}
              </p>

              <div className="space-y-4">
                {/* Full name */}
                <div>
                  <Label htmlFor="fullName" required>Full Name</Label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" required>Email Address</Label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Phone Number <span className="normal-case font-normal text-[#76777d]">(optional)</span></Label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" required>Password</Label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pr-10"
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e] transition-colors"
                      aria-label={showPass ? 'Hide password' : 'Show password'}>
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm password */}
                <div>
                  <Label htmlFor="confirm" required>Confirm Password</Label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`form-input pr-10 ${confirm && password !== confirm ? 'form-input-error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e] transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      <EyeIcon show={showConfirm} />
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Passwords don't match
                    </p>
                  )}
                  {confirm && password === confirm && confirm.length > 0 && (
                    <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-[#c6c6cd] accent-[#3980f4] cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="terms" className="text-xs text-[#45464d] cursor-pointer leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-[#3980f4] hover:underline font-medium">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#3980f4] hover:underline font-medium">Privacy Policy</a>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={goBack}
                  className="flex-1 py-3 text-sm font-medium border border-[#c6c6cd] rounded-lg text-[#45464d] hover:bg-[#f2f4f6] transition-colors">
                  Back
                </button>
                <button type="button" onClick={goNext} disabled={loading}
                  className="flex-1 btn-gold">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : role === 'hotel_owner' ? 'Continue' : 'Create Account'}
                </button>
              </div>

              <p className="text-center text-sm text-[#45464d] mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3980f4] font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* STEP 3 — Owner property info                           */}
          {/* ══════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-1">Property Details</h1>
              <p className="text-sm text-[#45464d] mb-7">
                Tell us about your property. Our team will review and approve within 24–48 hours.
              </p>

              <div className="space-y-4">
                {/* Business / hotel name */}
                <div>
                  <Label htmlFor="businessName" required>Hotel / Business Name</Label>
                  <input
                    id="businessName"
                    type="text"
                    placeholder="e.g. The Azure Resort & Spa"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="hotelAddress" required>Hotel Address</Label>
                  <input
                    id="hotelAddress"
                    type="text"
                    placeholder="123 Ocean Drive"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* City + Country row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" required>City</Label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Miami"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" required>Country</Label>
                    <input
                      id="country"
                      type="text"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Rooms + Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="numRooms" required>Number of Rooms</Label>
                    <input
                      id="numRooms"
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      value={numRooms}
                      onChange={(e) => setNumRooms(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" required>Category</Label>
                    <div className="relative">
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-input appearance-none pr-8 cursor-pointer"
                      >
                        <option value="" disabled>Select…</option>
                        <option value="1_star">⭐ 1 Star</option>
                        <option value="2_star">⭐⭐ 2 Star</option>
                        <option value="3_star">⭐⭐⭐ 3 Star</option>
                        <option value="4_star">⭐⭐⭐⭐ 4 Star</option>
                        <option value="5_star">⭐⭐⭐⭐⭐ 5 Star</option>
                        <option value="boutique">🏡 Boutique</option>
                        <option value="guest_house">🏠 Guest House</option>
                        <option value="apartment">🏢 Apartment</option>
                      </select>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    You can upload your business license, hotel photos, and add room categories after your account is approved.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={goBack}
                  className="flex-1 py-3 text-sm font-medium border border-[#c6c6cd] rounded-lg text-[#45464d] hover:bg-[#f2f4f6] transition-colors">
                  Back
                </button>
                <button type="button" onClick={goNext} disabled={loading}
                  className="flex-1 btn-gold">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting…
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
