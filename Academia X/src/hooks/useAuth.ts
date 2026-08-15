import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { authService } from '@services/index';
import { fetchProfile } from '@services/auth.service';
import { ROUTES } from '@config/routes';
import type { LoginCredentials, SignupPayload, UserRole } from '@/types/auth.types';

/**
 * Convenience hook that exposes auth state + bound actions.
 * Session bootstrapping is handled once at the app root via `initAuth()`.
 */
export function useAuth() {
  const { user, session, isAuthenticated, isLoading, setUser, logout: clearStore } = useAuthStore();
  const navigate = useNavigate();

  /**
   * Sign in with email/password then immediately fetch the profile so we can
   * redirect to the correct role dashboard without waiting for the async
   * onAuthStateChange callback to fire and update the store.
   */
  const login = async (credentials: LoginCredentials) => {
    const { session: newSession } = await authService.login(credentials);

    // Fetch the profile directly from the auth data returned by signInWithPassword
    // so we don't race against the onAuthStateChange store update.
    const profile = newSession?.user
      ? await fetchProfile(newSession.user.id).catch(() => null)
      : null;

    // Eagerly update the store so the rest of the app is in sync immediately.
    setUser(profile);

    navigate(getRoleDashboard(profile?.role), { replace: true });
  };

  /** Register a new account — Supabase sends a confirmation email by default. */
  const signup = async (payload: SignupPayload) => {
    await authService.signup(payload);
  };

  /** Sign out, clear store, and redirect to login. */
  const logout = async () => {
    await authService.logout();
    clearStore();
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  return { user, session, isAuthenticated, isLoading, login, signup, logout };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleDashboard(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin': return ROUTES.SUPER_ADMIN.DASHBOARD;
    case 'admin':       return ROUTES.ADMIN.DASHBOARD;
    case 'teacher':     return ROUTES.TEACHER.DASHBOARD;
    case 'student':     return ROUTES.STUDENT.DASHBOARD;
    default:            return ROUTES.AUTH.LOGIN;
  }
}
