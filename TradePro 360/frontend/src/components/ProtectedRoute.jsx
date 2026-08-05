import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute
 * Wraps a page and enforces auth + role.
 *
 * Props:
 *   allowedRoles  — array of roles permitted, e.g. ["admin"] or ["engineer","admin"]
 *   children      — the protected page component
 *   redirectTo    — where to send unauthorised users (default "/")
 */
export default function ProtectedRoute({ allowedRoles = [], children, redirectTo = "/" }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "allowed" | "denied"

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setStatus("denied");
        navigate(redirectTo, {
          replace: true,
          state: { authError: "Please sign in to access this page." },
        });
        return;
      }

      // Fetch role from profiles table (source of truth)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      if (error || !profile) {
        setStatus("denied");
        navigate(redirectTo, {
          replace: true,
          state: { authError: "Could not verify your account. Please sign in again." },
        });
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        setStatus("denied");
        const msg =
          profile.role === "customer"
            ? "You need an admin or engineer account to access this page."
            : `Access restricted. Required role: ${allowedRoles.join(" or ")}.`;
        navigate(redirectTo, {
          replace: true,
          state: { authError: msg },
        });
        return;
      }

      setStatus("allowed");
    };

    check();
    return () => { cancelled = true; };
  }, [allowedRoles, navigate, redirectTo]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
          <p className="text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return null;

  return children;
}
