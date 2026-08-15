import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, GraduationCap as StudentIcon, BookOpen, Shield } from 'lucide-react';

import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@config/routes';

// ── Schema ────────────────────────────────────────────────────────────────────

const signupSchema = z
  .object({
    full_name:       z.string().min(2, 'Full name must be at least 2 characters'),
    email:           z.string().email('Enter a valid email address'),
    role:            z.enum(['student', 'teacher', 'admin'], { message: 'Select a role to continue' }),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// ── Role card config ──────────────────────────────────────────────────────────

const ROLES = [
  {
    value:       'student' as const,
    label:       'Student',
    description: 'Access courses & submissions',
    icon:        StudentIcon,
    color:       'indigo',
  },
  {
    value:       'teacher' as const,
    label:       'Teacher',
    description: 'Manage classes & grades',
    icon:        BookOpen,
    color:       'purple',
  },
  {
    value:       'admin' as const,
    label:       'Admin',
    description: 'Institute administration',
    icon:        Shield,
    color:       'violet',
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError,         setServerError]         = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormValues) => {
    setServerError(null);
    try {
      await signup({
        full_name: data.full_name,
        email:     data.email,
        password:  data.password,
        role:      data.role,
      });
      // Supabase sends a confirmation email; redirect to login with a hint
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Sign up failed. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] px-4 py-10">
      {/* Ambient gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-2.5 mb-8">
        <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
          <GraduationCap className="w-6 h-6 text-indigo-400" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">AcademiaX</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg backdrop-blur-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white">Create an Account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Join AcademiaX and get started in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
            >
              {serverError}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                aria-describedby={errors.full_name ? 'full-name-error' : undefined}
                aria-invalid={!!errors.full_name}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                {...register('full_name')}
              />
            </div>
            {errors.full_name && (
              <p id="full-name-error" role="alert" className="text-xs text-red-400">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name@institute.edu"
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                aria-invalid={!!errors.email}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p id="signup-email-error" role="alert" className="text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <p className="block text-sm font-medium text-slate-300" id="role-label">
              I am a…
            </p>
            {/* Hidden input to register with RHF */}
            <input type="hidden" {...register('role')} />
            <div
              className="grid grid-cols-3 gap-3"
              role="radiogroup"
              aria-labelledby="role-label"
              aria-describedby={errors.role ? 'role-error' : undefined}
            >
              {ROLES.map(({ value, label, description, icon: Icon }) => {
                const isSelected = selectedRole === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setValue('role', value, { shouldValidate: true })}
                    className={[
                      'relative flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300',
                    ].join(' ')}
                  >
                    <Icon
                      className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-[10px] leading-tight mt-0.5 text-slate-500">
                        {description}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        aria-hidden="true"
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p id="role-error" role="alert" className="text-xs text-red-400">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
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
              <p id="signup-password-error" role="alert" className="text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
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
              <p id="confirm-password-error" role="alert" className="text-xs text-red-400">
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
                Creating Account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
