import { supabase } from '@lib/supabase';
import { useAuthStore } from '@store/authStore';
import type { LoginCredentials, SignupPayload, ResetPasswordPayload, UpdatePasswordPayload, UserProfile } from '@/types/auth.types';
import type { Database } from '@/types/database.types';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// ── Profile ──────────────────────────────────────────────────────────────────

/**
 * Fetch a user's profile row from the `profiles` table by their auth user ID.
 * Returns null (not throws) when no row is found so callers can handle gracefully.
 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — not an error we should throw
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as UserProfile;
}

// ── Session bootstrap ─────────────────────────────────────────────────────────

/**
 * Call once at app startup (e.g. inside a top-level useEffect).
 * 1. Reads the current Supabase session and hydrates the store immediately.
 * 2. Subscribes to `onAuthStateChange` to keep the store in sync for the
 *    lifetime of the app (token refresh, logout from another tab, etc.).
 *
 * Returns the `unsubscribe` cleanup function — call it on component unmount.
 */
export function initAuth(): () => void {
  const { setUser, setSession, setIsLoading, logout } = useAuthStore.getState();

  setIsLoading(true);

  // Hydrate from existing session without waiting for a state-change event
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    setSession(session);
    if (session?.user) {
      const profile = await fetchProfile(session.user.id).catch(() => null);
      setUser(profile);
    } else {
      setUser(null);
    }
  });

  // Subscribe to future auth changes (login, logout, token refresh, deep-link)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const profile = await fetchProfile(session.user.id).catch(() => null);
        setUser(profile);
      } else {
        // SIGNED_OUT or session expired
        logout();
      }
    },
  );

  return () => subscription.unsubscribe();
}

// ── Auth actions ──────────────────────────────────────────────────────────────

/**
 * Sign in with email and password.
 * Supabase fires `onAuthStateChange` automatically, so the store will update.
 */
export async function login({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Create a new account with user metadata (full_name, role).
 *
 * Two-step approach that works regardless of DB trigger configuration:
 *   1. Call signUp() — role stored in user_metadata only (safe with anon key).
 *   2. Immediately upsert the profiles row so the role is persisted even if
 *      the DB trigger is missing, broken, or only handles student/teacher.
 *
 * The upsert uses the freshly issued JWT from step 1, so RLS policies that
 * allow users to insert/update their own profile row will pass.
 */
export async function signup({ email, password, full_name, role }: SignupPayload) {
  // ── Step 1: Create the auth user ──────────────────────────────────────────
  // Metadata in `data` is stored in user_metadata (safe with anon key).
  // Do NOT use app_metadata — that requires the service role key.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
      },
    },
  });

  if (error) {
    // Surface a friendlier message for the most common 400 case
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('user already exists')
    ) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    throw error;
  }

  if (!data.user) {
    throw new Error('Signup succeeded but no user was returned. Please try again.');
  }

  // ── Step 2: Profile creation ──────────────────────────────────────────────
  // The PostgreSQL trigger `on_auth_user_created` handles inserting/updating
  // the profile row automatically inside Supabase with SECURITY DEFINER privileges.
  //
  // We only attempt a client-side fallback upsert if an active session is issued
  // (i.e. email confirmation disabled). If data.session is null, skipping this prevents
  // 401 Unauthorized errors caused by unauthenticated RLS requests.
  if (data.session) {
    const safeRole: ProfileInsert['role'] =
      role === 'admin' || role === 'teacher' || role === 'student'
        ? role
        : 'student';

    const profileRow: ProfileInsert = {
      id:        data.user.id,
      email:     data.user.email ?? email,
      full_name,
      role:      safeRole,
    };

    try {
      await (
        supabase.from('profiles') as ReturnType<typeof supabase.from>
      ).upsert(profileRow, { onConflict: 'id' });
    } catch {
      // Non-fatal: trigger already inserted the profile row inside Postgres
    }
  }

  return data;
}


/**
 * Sign out the current user.
 * Supabase fires `onAuthStateChange(SIGNED_OUT)` which clears the store via
 * the subscription set up in `initAuth()`.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Send a password-reset email that redirects back to `/reset-password`.
 */
export async function resetPassword({ email }: ResetPasswordPayload) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

/**
 * Update the current user's password (called from the reset-password page).
 */
export async function updatePassword({ password }: UpdatePasswordPayload) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

/**
 * Alias kept for backward-compatibility with existing callers.
 * @deprecated Use `fetchProfile` + `initAuth` directly.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return fetchProfile(session.user.id);
}

// Re-export old name used by authService.sendPasswordResetEmail callers
export { resetPassword as sendPasswordResetEmail };
