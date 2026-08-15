import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { AuthState, UserProfile } from '@/types/auth.types';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,

        setUser: (user: UserProfile | null) =>
          set(
            { user, isAuthenticated: !!user, isLoading: false },
            false,
            'auth/setUser',
          ),

        setSession: (session: Session | null) =>
          set({ session }, false, 'auth/setSession'),

        setIsLoading: (isLoading: boolean) =>
          set({ isLoading }, false, 'auth/setIsLoading'),

        logout: () =>
          set(
            { user: null, session: null, isAuthenticated: false, isLoading: false },
            false,
            'auth/logout',
          ),
      }),
      {
        name: 'academia-x-auth',
        // Only persist user identity across reloads — never session tokens
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
