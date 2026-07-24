-- ─────────────────────────────────────────────────────────────────────────────
-- CarFever — Required One-Time Supabase Migration
--
-- HOW TO RUN (takes ~10 seconds):
--   1. Open https://supabase.com → your project → SQL Editor
--   2. Click  "New Query"
--   3. Paste this entire file → click "Run"
--
-- Run this ONCE before using the CarFever auth system.
-- ─────────────────────────────────────────────────────────────────────────────

-- Standalone credentials table (does NOT depend on auth.users)
CREATE TABLE IF NOT EXISTS user_credentials (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT   NOT NULL,
  password_hash TEXT   NOT NULL,
  name          TEXT   NOT NULL,
  company_name  TEXT   NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS user_credentials_email_idx
  ON user_credentials (email);

-- Verify
SELECT 'user_credentials table ready' AS status;
