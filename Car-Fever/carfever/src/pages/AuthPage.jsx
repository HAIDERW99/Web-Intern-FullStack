/**
 * AuthPage.jsx — CarFever Login & Registration screen
 *
 * Layout  : two-column split (hero image left | form panel right)
 * Routing : onLoginSuccess() → 'dashboard'   |   onGoHome() → 'home'
 * Tabs    : 'login' | 'signup'  (state-driven, smooth opacity transition)
 * Password: independent show/hide toggles per field
 */

import { useState, useEffect } from 'react'
import api from '../services/api'

// ─── Inline SVG icons (no extra deps, matches Material Symbols style) ──────
function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconEye({ off = false }) {
  return off ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconBusiness() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ─── Reusable input wrapper ─────────────────────────────────────────────────
function InputField({ id, label, type = 'text', placeholder, value, onChange,
  icon, rightSlot, autoComplete }) {
  return (
    <div>
      {label && (
        <label htmlFor={id}
          className="block text-[13px] font-semibold text-[#43474f] mb-1.5 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-[#747780] pointer-events-none select-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`
            w-full border border-[#c4c6d1] rounded-lg bg-[#f8f9fa] text-[#181c1e]
            text-[15px] placeholder-[#747780]
            transition-all duration-200
            focus:outline-none focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20
            focus:bg-white
            ${icon ? 'pl-10' : 'pl-4'}
            ${rightSlot ? 'pr-11' : 'pr-4'}
            py-3
          `}
        />
        {rightSlot && (
          <span className="absolute right-3 flex items-center">{rightSlot}</span>
        )}
      </div>
    </div>
  )
}

// ─── Toast notification ──────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200)
    return () => clearTimeout(t)
  }, [onDismiss])

  const colours = type === 'success'
    ? 'bg-[#10B981] text-white'
    : 'bg-red-600 text-white'

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3
      px-5 py-3 rounded-xl shadow-2xl text-[14px] font-semibold
      animate-[fadeInUp_0.3s_ease-out] ${colours}`}>
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )}
      {message}
    </div>
  )
}

// ─── LOGIN FORM ──────────────────────────────────────────────────────────────
function LoginForm({ onSuccess, onGoogleLogin }) {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    try {
      const res = await api.auth.login({ email: email.trim().toLowerCase(), password })
      // res.user = { id, email, name, company_name, phone }
      onSuccess(res.user)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 font-medium">
          {error}
        </div>
      )}

      <InputField id="login-email" label="Email Address" type="email"
        placeholder="name@dealership.com" value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email" icon={<IconMail />} />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password"
            className="text-[13px] font-semibold text-[#43474f] tracking-wide">
            Password
          </label>
          <button type="button"
            className="text-[13px] font-semibold text-[#0050cb] hover:text-[#0066ff] transition-colors">
            Forgot Password?
          </button>
        </div>
        <InputField id="login-password"
          type={showPwd ? 'text' : 'password'}
          placeholder="••••••••" value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password" icon={<IconLock />}
          rightSlot={
            <button type="button" onClick={() => setShowPwd(s => !s)}
              className="text-[#747780] hover:text-[#0050cb] transition-colors p-0.5"
              aria-label={showPwd ? 'Hide password' : 'Show password'}>
              <IconEye off={showPwd} />
            </button>
          } />
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
        <button type="button" onClick={() => setRememberMe(s => !s)}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
            ${rememberMe ? 'bg-[#0050cb] border-[#0050cb]' : 'bg-white border-[#c4c6d1] hover:border-[#0050cb]'}`}>
          {rememberMe && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span className="text-[14px] text-[#43474f]">Remember Me</span>
      </label>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-lg bg-[#0050cb] hover:bg-[#0066ff] active:scale-[0.98]
          text-white font-grotesk font-bold text-[15px] tracking-wide
          transition-all duration-150 shadow-[0_4px_16px_rgba(0,80,203,0.35)]
          disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Signing in…
          </>
        ) : 'Sign In to Dashboard'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#c4c6d1]" />
        <span className="text-[13px] text-[#747780]">Or continue with</span>
        <div className="flex-1 h-px bg-[#c4c6d1]" />
      </div>

      {/* Google SSO */}
      <button type="button"
        onClick={onGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-[#c4c6d1]
          bg-white hover:bg-[#f8f9fa] hover:border-[#0050cb] active:scale-[0.98]
          text-[14px] font-semibold text-[#181c1e] transition-all duration-150">
        <IconGoogle />
        Continue with Google
      </button>
    </form>
  )
}

// ─── SIGN-UP FORM ────────────────────────────────────────────────────────────
function SignUpForm({ onSwitchToLogin, onGoogleLogin }) {
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [agreed,    setAgreed]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [toast,     setToast]     = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!fullName || !email || !password) { setError('Please fill in all fields.'); return }
    if (!agreed)             { setError('Please agree to the Terms of Service.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    try {
      await api.auth.register({
        name:         fullName.trim(),
        email:        email.trim().toLowerCase(),
        company_name: fullName.trim(),   // dealer name doubles as company name
        password,
      })
      setToast('Account created! Please sign in.')
      setFullName(''); setEmail(''); setPassword(''); setAgreed(false)
      setTimeout(() => onSwitchToLogin(), 1800)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {toast && <Toast message={toast} type="success" onDismiss={() => setToast(null)} />}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 font-medium">
          {error}
        </div>
      )}

      <InputField id="signup-name" label="Dealership / Full Name"
        placeholder="City Motors London" value={fullName}
        onChange={e => setFullName(e.target.value)}
        autoComplete="organization" icon={<IconBusiness />} />

      <InputField id="signup-email" label="Professional Email"
        type="email" placeholder="name@dealership.com" value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email" icon={<IconMail />} />

      <div>
        <label htmlFor="signup-password"
          className="block text-[13px] font-semibold text-[#43474f] mb-1.5 tracking-wide">
          Create Password
        </label>
        <InputField id="signup-password"
          type={showPwd ? 'text' : 'password'}
          placeholder="Minimum 8 characters" value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password" icon={<IconLock />}
          rightSlot={
            <button type="button" onClick={() => setShowPwd(s => !s)}
              className="text-[#747780] hover:text-[#0050cb] transition-colors p-0.5"
              aria-label={showPwd ? 'Hide password' : 'Show password'}>
              <IconEye off={showPwd} />
            </button>
          } />
        {/* Strength bar */}
        {password.length > 0 && (
          <div className="flex gap-1 mt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300
                ${password.length >= i*3 ? (password.length >= 12 ? 'bg-[#10B981]' : password.length >= 8 ? 'bg-amber-400' : 'bg-red-400') : 'bg-[#e0e3e5]'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <button type="button" onClick={() => setAgreed(s => !s)}
          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
            ${agreed ? 'bg-[#0050cb] border-[#0050cb]' : 'bg-white border-[#c4c6d1] hover:border-[#0050cb]'}`}>
          {agreed && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span className="text-[13px] text-[#43474f] leading-snug">
          I agree to the{' '}
          <button type="button" className="text-[#0050cb] font-semibold hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="text-[#0050cb] font-semibold hover:underline">Privacy Policy</button>.
        </span>
      </label>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-lg bg-[#0050cb] hover:bg-[#0066ff] active:scale-[0.98]
          text-white font-grotesk font-bold text-[15px] tracking-wide
          transition-all duration-150 shadow-[0_4px_16px_rgba(0,80,203,0.35)]
          disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Creating Account…
          </>
        ) : 'Register as Dealer'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#c4c6d1]" />
        <span className="text-[13px] text-[#747780]">Or continue with</span>
        <div className="flex-1 h-px bg-[#c4c6d1]" />
      </div>

      {/* Google SSO */}
      <button type="button"
        onClick={onGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-[#c4c6d1]
          bg-white hover:bg-[#f8f9fa] hover:border-[#0050cb] active:scale-[0.98]
          text-[14px] font-semibold text-[#181c1e] transition-all duration-150">
        <IconGoogle />
        Continue with Google
      </button>
    </form>
  )
}

// ─── MAIN AUTH PAGE ──────────────────────────────────────────────────────────
export default function AuthPage({ onLoginSuccess, onGoHome }) {
  const [tab, setTab] = useState('login')   // 'login' | 'signup'

  const HERO_IMG = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&auto=format&fit=crop'

  const handleGoogleLogin = () => {
    console.log('[AUTH] Initiating Google Sign-In redirect to backend OAuth endpoint...')
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    window.location.href = `${apiBase}/api/auth/google`
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] font-inter">

      {/* ══ LEFT — Hero panel ════════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative w-[58%] flex-col overflow-hidden">
        {/* Background image */}
        <img src={HERO_IMG} alt="Premium car"
          className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-transparent" />

        {/* Logo top-left */}
        <div className="relative z-10 px-10 pt-9">
          <button onClick={onGoHome}
            className="flex items-center gap-2 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="20" r="1"/><circle cx="20" cy="20" r="1"/>
            </svg>
            <span className="font-grotesk font-bold text-[22px] tracking-tight text-white group-hover:text-white/80 transition-colors">
              Car<span style={{ color: '#bb0014' }}>Fever</span>
            </span>
          </button>
        </div>

        {/* Hero copy — bottom-left */}
        <div className="relative z-10 mt-auto px-10 pb-12">
          <h1 className="font-grotesk font-bold text-[42px] leading-[1.15] text-white tracking-tight mb-4">
            Precision meets<br />performance.
          </h1>
          <p className="text-[16px] text-white/70 max-w-sm leading-relaxed">
            The premium ecosystem for automotive professionals and enthusiasts who demand excellence in every transaction.
          </p>
          {/* Trust badges */}
          <div className="flex gap-6 mt-8">
            {['142,593 Listings', 'Verified Dealers', 'Free History Checks'].map(t => (
              <div key={t} className="flex items-center gap-2 text-white/60 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#bb0014] flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Form panel ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile logo */}
        <div className="lg:hidden px-6 pt-7 pb-2">
          <button onClick={onGoHome} className="flex items-center gap-2">
            <span className="font-grotesk font-bold text-[22px] tracking-tight text-[#001839]">
              Car<span style={{ color: '#bb0014' }}>Fever</span>
            </span>
          </button>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-[420px]">

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,26,53,0.10)] border border-[#e0e3e5] overflow-hidden">

              {/* Tab switcher */}
              <div className="flex border-b border-[#e0e3e5]">
                {[
                  { key: 'login',  label: 'Sign In' },
                  { key: 'signup', label: 'Create Account' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`flex-1 py-4 text-[15px] font-semibold relative transition-colors duration-200
                      ${tab === key ? 'text-[#0050cb]' : 'text-[#747780] hover:text-[#181c1e]'}`}>
                    {label}
                    <span className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full transition-all duration-300
                      ${tab === key ? 'bg-[#0050cb] opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>

              {/* Form body */}
              <div className="px-7 py-7">
                <div className={`transition-opacity duration-200 ${tab === 'login' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {tab === 'login' && <LoginForm onSuccess={onLoginSuccess} onGoogleLogin={handleGoogleLogin} />}
                </div>
                <div className={`transition-opacity duration-200 ${tab === 'signup' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {tab === 'signup' && <SignUpForm onSwitchToLogin={() => setTab('login')} onGoogleLogin={handleGoogleLogin} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 pb-7 text-center">
          <p className="text-[13px] text-[#747780] mb-2">© 2024 CarFever. Precision &amp; Performance.</p>
          <div className="flex items-center justify-center gap-4">
            {['Support', 'Security', 'Status'].map(l => (
              <button key={l} className="text-[13px] text-[#747780] hover:text-[#0050cb] transition-colors">
                {l}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
