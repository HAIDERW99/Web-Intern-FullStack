import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// Replace this URL with your own hotel lobby image placed at src/assets/hotel-lobby.jpg
const hotelLobby = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80';

const EyeIcon = ({ show }) =>
  show ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('guest'); // 'guest' | 'owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Check role from profiles table (or fallback to user_metadata)
      let userRole = data.user?.user_metadata?.role || 'customer';

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.role) {
        userRole = profile.role;
      } else {
        // Auto-heal missing profile row
        await supabase.from('profiles').upsert({
          id: data.user.id,
          role: userRole,
          full_name: data.user?.user_metadata?.full_name || 'User',
          phone: data.user?.user_metadata?.phone || null,
        });
      }

      // Redirect directly based on user's actual role
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'hotel_owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while signing in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel — Hero ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={hotelLobby}
          alt="Luxury hotel lobby"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/80 via-[#0a0f1e]/20 to-transparent" />

        {/* Brand badge */}
        <div className="relative z-10 flex flex-col justify-end p-10 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#fea619] text-3xl select-none">
              hotel_class
            </span>
            <span className="text-white font-bold text-2xl tracking-tight">HostHaven</span>
          </div>
          <p className="text-white/80 text-base max-w-xs leading-relaxed">
            Elevate your hospitality experience. Seamlessly manage bookings, staff, and
            properties from one central hub.
          </p>
        </div>
      </div>

      {/* ─── Right Panel — Form ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="material-symbols-outlined text-[#fea619] text-2xl">hotel_class</span>
            <span className="font-bold text-xl text-[#131b2e]">HostHaven</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-[#45464d] mb-7">
            Please enter your details to sign in.
          </p>

          {/* ── Tab toggle ── */}
          <div className="flex bg-[#eceef0] rounded-lg p-1 mb-6">
            {[
              { key: 'guest', label: 'Guest Login' },
              { key: 'owner', label: 'Owner / Admin' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setError(''); }}
                className={`flex-1 py-2 text-sm rounded-md transition-all duration-150 ${
                  tab === key ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#45464d] mb-1.5 tracking-wide uppercase">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#45464d] tracking-wide uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#3980f4] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#191c1e] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#c6c6cd] text-[#3980f4] accent-[#3980f4] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-[#45464d] cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Sign In */}
            <button type="submit" disabled={loading} className="btn-gold mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#e0e3e5]" />
            <span className="text-xs text-[#76777d] font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-[#e0e3e5]" />
          </div>

          {/* ── OAuth Buttons ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn-outline flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              className="btn-outline flex items-center justify-center gap-2 text-sm"
              disabled
              title="Apple login coming soon"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* ── Sign up link ── */}
          <p className="text-center text-sm text-[#45464d] mt-6">
            New to HostHaven?{' '}
            <Link
              to="/register"
              className="text-[#3980f4] font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
