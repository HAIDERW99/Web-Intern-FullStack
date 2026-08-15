/**
 * AcademiaX Authentication & RBAC types.
 * These mirror the Supabase `auth.users` metadata plus app-level roles.
 */

import type { Session } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginCredentials {
  full_name: string;
  role: UserRole;
}

export interface ResetPasswordPayload {
  email: string;
}

export interface UpdatePasswordPayload {
  password: string;
}
