import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Landing page for OAuth redirects (Google, Apple).
 * Supabase handles the token exchange — we just wait for the
 * session to settle, fetch the profile role, then redirect.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      // Give Supabase a moment to exchange the code for a session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Auth failed or was cancelled — back to login
        navigate('/login', { replace: true });
        return;
      }

      // Fetch role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role ?? 'customer';

      if (role === 'admin')       navigate('/admin/dashboard', { replace: true });
      else if (role === 'hotel_owner') navigate('/properties', { replace: true });
      else                        navigate('/', { replace: true });
    };

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <svg className="animate-spin h-8 w-8 text-[#fea619]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-sm text-[#45464d] font-medium">Signing you in…</p>
    </div>
  );
}
