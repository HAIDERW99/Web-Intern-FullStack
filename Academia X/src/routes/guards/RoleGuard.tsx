import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { ROUTES } from '@config/routes';
import type { UserRole } from '@/types/auth.types';

interface RoleGuardProps {
  /** Roles permitted to access this route subtree. */
  allowedRoles: UserRole[];
}

/**
 * Protects routes by role. Must be nested inside <AuthGuard />.
 * Redirects to /unauthorized when the user's role is not in allowedRoles.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
