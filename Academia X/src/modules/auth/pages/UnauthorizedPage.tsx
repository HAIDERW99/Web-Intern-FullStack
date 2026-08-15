import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { ROUTES } from '@config/routes';
import type { UserRole } from '@/types/auth.types';

// ── Helper ────────────────────────────────────────────────────────────────────

function getRoleDashboard(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin': return ROUTES.SUPER_ADMIN.DASHBOARD;
    case 'admin':       return ROUTES.ADMIN.DASHBOARD;
    case 'teacher':     return ROUTES.TEACHER.DASHBOARD;
    case 'student':     return ROUTES.STUDENT.DASHBOARD;
    default:            return ROUTES.AUTH.LOGIN;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnauthorizedPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F19] px-4">
      {/* Ambient glowing blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl" />
      </div>

      {/* Brand wordmark */}
      <div className="relative z-10 flex items-center gap-2.5 mb-8">
        <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
          <GraduationCap className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">AcademiaX</span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md backdrop-blur-md bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 text-center shadow-2xl shadow-black/40"
        role="main"
        aria-labelledby="unauthorized-heading"
      >
        {/* Icon badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl scale-150"
            />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20">
              {/* X marks */}
              <span
                aria-hidden="true"
                className="absolute -top-1 -left-1 text-rose-400/60 text-xs font-bold select-none"
              >
                ✕
              </span>
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 text-rose-400/60 text-xs font-bold select-none"
              >
                ✕
              </span>
              <Lock className="w-8 h-8 text-rose-400" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1
          id="unauthorized-heading"
          className="text-2xl font-bold text-white mb-3"
        >
          403 — Access Denied
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto mb-8">
          You don't have the required permissions to access this page. Please
          contact your administrator if you believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {/* Secondary — Go Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-transparent border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 hover:text-white hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go Back
          </button>

          {/* Primary — Return to Dashboard */}
          <button
            type="button"
            onClick={() => navigate(getRoleDashboard(user?.role), { replace: true })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Return to Dashboard
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <p className="relative z-10 mt-6 text-xs text-slate-600">
        Error code 403 · Forbidden
      </p>
    </div>
  );
}
