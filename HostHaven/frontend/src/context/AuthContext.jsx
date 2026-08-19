import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userObj) => {
    if (!userObj) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, full_name, phone')
        .eq('id', userObj.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        const fallback = {
          role: userObj.user_metadata?.role || 'customer',
          full_name: userObj.user_metadata?.full_name || 'User',
          phone: userObj.user_metadata?.phone || null,
        };
        setProfile(fallback);

        // Auto-heal profile table in background
        supabase.from('profiles').upsert({
          id: userObj.id,
          ...fallback,
        }).then();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setProfile(null);
        }

        // Persist session for axios interceptor
        if (session) {
          localStorage.setItem('hosthaven_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('hosthaven_session');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
