/**
 * Supabase client — shared singleton used by all route handlers.
 * Uses the service_role key so RLS is bypassed on the server side.
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  SUPABASE_URL or SUPABASE_KEY is missing. Check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

module.exports = supabase
