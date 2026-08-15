import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { authService } from '@services/index';
import { ROUTES } from '@config/routes';

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// ── Password strength helpers ─────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthResult {
  score:   number; // 0–4
  level:   StrengthLevel;
  label:   string;
  color:   string;
  barColor: string;
}

function getPasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, level: 'weak', label: '', color: 'text-slate-500', barColor: 'bg-slate-700' };
  }

  let score = 0;
  if (password.length >= 8)                          score++;
  if (password.length >= 12)                         score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password))                           score++;
  if (/[^A-Za-z0-9]/.test(password))                score++;

  // Clamp to 1–4 once a character exists
  const clamped = Math.min(Math.max(score, 1), 4) as 1 | 2 | 3 | 4;

  const map: Record<1 | 2 | 3 | 4, Omit<StrengthResult, 'score'>> = {
    1: { level: 'weak',   label: 'Weak',   color: 'text-red-400',    barColor: 'bg-red-500' },
    2: { level: 'fair',   label: 'Fair',   color: 'text-amber-400',  barColor: 'bg-amber-500' },
    3: { level: 'good',   label: 'Good',   color: 'text-yellow-400', barColor: 'bg-yellow-400' },
    4: { level: 'strong', label: 'Strong', color: 'text-emerald-400', barColor: 'bg-emerald-500' },
  };

  return { score: clamped, ...map[clamped] };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError,         setServerError]         = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');
  const strength      = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await authService.updatePassword({ password: data.password });
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Could not update password. Please try again.',
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
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
            Your new password must be different from previously used passwords.
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

          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-300">
              New Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
                aria-describedby="new-password-strength new-password-error"
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

            {/* Strength meter */}
            {passwordValue && (
              <div id="new-password-strength" aria-live="polite">
                <div className="flex gap-1 mt-2" aria-hidden="true">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={[
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        bar <= strength.score ? strength.barColor : 'bg-slate-700',
                      ].join(' ')}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${strength.color}`}>
                  Password strength:{' '}
                  <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}

            {errors.password && (
              <p id="new-password-error" role="alert" className="text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-300">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm new password"
                aria-describedby={errors.confirmPassword ? 'confirm-new-password-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
                className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none focus:text-slate-300 transition-colors"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword
                  ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                  : <Eye    className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-new-password-error" role="alert" className="text-xs text-red-400">
                {errors.confirmPassword.message}
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
                Updating…
              </>
            ) : (
              'Update Password'
            )}
          </button>

          {/* Back link */}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="flex items-center justify-center gap-1.5 w-full text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to log in
          </Link>
        </form>
      </div>
    </div>
  );
}
