import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (err) { setError(err.message); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 inline-flex" title="Return to Home">
          <span className="material-symbols-outlined text-[#fea619] text-2xl">hotel_class</span>
          <span className="font-bold text-xl text-[#131b2e]">HostHaven</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#191c1e] mb-2">Check your email</h2>
            <p className="text-sm text-[#45464d] mb-6">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
            </p>
            <Link to="/login" className="text-[#3980f4] hover:underline text-sm font-medium">
              ← Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#191c1e] mb-1">Forgot Password?</h1>
            <p className="text-sm text-[#45464d] mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] mb-1.5 tracking-wide uppercase">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-gold">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-[#45464d] mt-5">
              Remember your password?{' '}
              <Link to="/login" className="text-[#3980f4] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
