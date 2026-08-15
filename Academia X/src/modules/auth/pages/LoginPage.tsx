import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@config/routes';

// ── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:       z.string().email('Enter a valid email address'),
  password:    z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe:  z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login({ email: data.email, password: data.password });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F19]">
      {/* ── Left branding panel (desktop only) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Ambient gradient blobs */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-purple-600/20"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"
        />

        {/* Geometric visual overlay */}
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-purple-500/15" />
            {/* Grid lines */}
            <svg
              viewBox="0 0 320 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full opacity-20"
            >
              {/* Isometric-style cubes */}
              <path d="M160 60 L220 95 L220 165 L160 200 L100 165 L100 95 Z" stroke="#6366f1" strokeWidth="1" />
              <path d="M160 200 L160 260" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M100 165 L100 225" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M220 165 L220 225" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
              {/* Node dots */}
              <circle cx="160" cy="60"  r="4" fill="#818cf8" />
              <circle cx="220" cy="95"  r="3" fill="#a78bfa" />
              <circle cx="220" cy="165" r="3" fill="#a78bfa" />
              <circle cx="160" cy="200" r="4" fill="#818cf8" />
              <circle cx="100" cy="165" r="3" fill="#a78bfa" />
              <circle cx="100" cy="95"  r="3" fill="#a78bfa" />
              {/* Inner connections */}
              <line x1="160" y1="60"  x2="160" y2="200" stroke="#6366f1" strokeWidth="0.5" />
              <line x1="100" y1="95"  x2="220" y2="165" stroke="#6366f1" strokeWidth="0.5" />
              <line x1="220" y1="95"  x2="100" y2="165" stroke="#6366f1" strokeWidth="0.5" />
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-sm">
                <GraduationCap className="w-12 h-12 text-indigo-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Brand wordmark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <GraduationCap className="w-6 h-6 text-indigo-400" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AcademiaX</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Empowering Institute Operations
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              &amp; Academic Excellence
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            A unified platform for admins, teachers, and students to manage
            courses, attendance, assignments, and more.
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile brand header */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <GraduationCap className="w-8 h-8 text-indigo-400" aria-hidden="true" />
          <span className="text-2xl font-bold text-white">AcademiaX</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md backdrop-blur-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="mt-1 text-sm text-slate-400">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
              >
                <span>{serverError}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@institute.edu"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye    className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <Link
                to={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to={ROUTES.AUTH.SIGNUP}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
