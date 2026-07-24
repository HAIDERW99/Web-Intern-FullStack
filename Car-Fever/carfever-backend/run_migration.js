/**
 * run_migration.js — Creates user_credentials table in Supabase via direct PG connection.
 * Usage: node run_migration.js
 *
 * Requires DATABASE_URL in .env  (Supabase → Settings → Database → Connection string → URI)
 * Format: postgresql://postgres:[YOUR-PASSWORD]@db.tlznzvsyljmdgdjzijwj.supabase.co:5432/postgres
 */
require('dotenv').config()
const { Client } = require('pg')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('\n❌  DATABASE_URL not found in .env')
  console.error('   Add it from: Supabase Dashboard → Settings → Database → Connection string → URI')
  console.error('   Example: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.tlznzvsyljmdgdjzijwj.supabase.co:5432/postgres\n')
  process.exit(1)
}

const SQL = `
CREATE TABLE IF NOT EXISTS user_credentials (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT   NOT NULL,
  password_hash TEXT   NOT NULL,
  name          TEXT   NOT NULL,
  company_name  TEXT   NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_email_idx
  ON user_credentials (email);
`

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    console.log('✅  Connected to Supabase Postgres')
    await client.query(SQL)
    console.log('✅  Migration complete — user_credentials table is ready')

    // Verify
    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_credentials'"
    )
    if (rows.length > 0) {
      console.log('✅  Verified: user_credentials exists in public schema')
    } else {
      console.log('⚠️  Table not found after creation — check permissions')
    }
  } catch (err) {
    console.error('❌  Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
