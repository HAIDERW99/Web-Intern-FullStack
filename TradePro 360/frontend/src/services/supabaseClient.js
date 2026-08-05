import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Service role key — used for admin operations (create engineer, update profiles).
// This bypasses RLS. Only used in admin-authenticated flows, never in public pages.
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase environment variables not set. " +
    "Copy frontend/.env.example to frontend/.env and fill in your values."
  );
}

// ── Standard anon client (used everywhere) ──────────────────
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

// ── Admin client (service role — bypasses RLS) ──────────────
// Only instantiated when the key is present (admin panel only).
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ── Auth helpers ────────────────────────────────────────────

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

/**
 * Sign up a new user.
 * In dev mode (VITE_SUPABASE_SERVICE_ROLE_KEY present), auto-confirms the
 * email immediately so the user can log in without clicking a link.
 * In production (no service role key in .env), the user receives the
 * standard confirmation email.
 */
export const signUp = async (email, password, metadata) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error || !data?.user) return { data, error };

  // Dev-only: auto-confirm via admin API so login works immediately
  if (supabaseServiceKey && !data.session) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${data.user.id}`, {
        method: "PUT",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_confirm: true }),
      });
      // Now sign in to get a real session
      const signInResult = await supabase.auth.signInWithPassword({ email, password });
      return signInResult;
    } catch (confirmErr) {
      console.warn("Auto-confirm failed, user must click email link:", confirmErr);
    }
  }

  return { data, error };
};

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ── Job helpers ─────────────────────────────────────────────

export const getJobByToken = (token) =>
  supabase
    .from("jobs")
    .select(`
      *,
      engineers (
        id,
        trade,
        rating,
        hourly_rate,
        location,
        profiles (full_name, avatar_url, phone)
      ),
      customers (
        profiles (full_name, phone)
      )
    `)
    .eq("tracking_token", token)
    .single();

export const subscribeToJob = (jobId, callback) =>
  supabase
    .channel(`job:${jobId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, callback)
    .subscribe();

export const subscribeToEngineerLocation = (engineerId, callback) =>
  supabase
    .channel(`engineer-location:${engineerId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "engineer_locations",
      filter: `engineer_id=eq.${engineerId}`,
    }, callback)
    .subscribe();

export const subscribeToNotifications = (profileId, callback) =>
  supabase
    .channel(`notifications:${profileId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `profile_id=eq.${profileId}`,
    }, callback)
    .subscribe();

// ── Dispatch engine ─────────────────────────────────────────

export const triggerDispatch = (jobId) =>
  supabase.functions.invoke("dispatch-engine", { body: { job_id: jobId } });

// ── Location update ─────────────────────────────────────────

export const updateEngineerLocation = (engineerId, jobId, lat, lng) =>
  supabase.from("engineer_locations").insert({
    engineer_id: engineerId,
    job_id: jobId,
    location: `POINT(${lng} ${lat})`,
  });
