import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { ROUTES } from '@config/routes';

/**
 * Protects routes that require an authenticated session.
 * - Shows a full-screen spinner while the session is being resolved.
 * - Redirects to /auth/login (with `from` state) if unauthenticated.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-background"
        role="status"
        aria-label="Loading session"
      >
        <svg
          className="animate-spin h-10 w-10 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.AUTH.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}
