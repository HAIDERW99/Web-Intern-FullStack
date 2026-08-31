const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

// Public Anon Client (Subject to RLS if enabled)
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Admin Service Role Client (Bypasses RLS for backend authoritative actions)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

module.exports = {
  supabase,
  supabaseAdmin,
};
