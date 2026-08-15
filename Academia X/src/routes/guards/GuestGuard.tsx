import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { ROUTES } from '@config/routes';
import type { UserRole } from '@/types/auth.types';

/**
 * Prevents authenticated users from reaching guest-only pages (login, signup).
 * Redirects each role to its own dashboard.
 */
export function GuestGuard() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return <Outlet />;
}

function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'super_admin': return ROUTES.SUPER_ADMIN.DASHBOARD;
    case 'admin':       return ROUTES.ADMIN.DASHBOARD;
    case 'teacher':     return ROUTES.TEACHER.DASHBOARD;
    case 'student':     return ROUTES.STUDENT.DASHBOARD;
  }
}
