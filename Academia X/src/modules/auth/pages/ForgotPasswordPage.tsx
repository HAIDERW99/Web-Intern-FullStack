import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

import { authService } from '@services/index';
import { ROUTES } from '@config/routes';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [submitted,   setSubmitted]   = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await authService.sendPasswordResetEmail({ email: data.email });
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] px-4 py-10">
      {/* Ambient blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-2.5 mb-8">
        <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
          <GraduationCap className="w-6 h-6 text-indigo-400" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">AcademiaX</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
        {submitted ? (
          /* ── Success state ──────────────────────────────────────────────── */
          <div className="flex flex-col items-center text-center py-4 gap-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Check Your Inbox</h1>
              <p className="mt-2 text-sm text-slate-400 max-w-xs leading-relaxed">
                We've sent a password reset link to{' '}
                <span className="text-slate-300 font-medium">{getValues('email')}</span>.
                Check your spam folder if you don't see it.
              </p>
            </div>
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form state ─────────────────────────────────────────────────── */
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                Enter your registered email address and we'll send you a
                password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
                >
                  {serverError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="fp-email" className="block text-sm font-medium text-slate-300">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@institution.edu"
                    aria-describedby={errors.email ? 'fp-email-error' : undefined}
                    aria-invalid={!!errors.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="fp-email-error" role="alert" className="text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
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
                    Sending…
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Back link */}
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to Login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
