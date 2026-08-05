-- ============================================================
-- FIX: Auto-confirm emails for development
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- 
-- This updates auth.config to disable email confirmation
-- so users can sign up and log in immediately without
-- clicking a confirmation link.
--
-- ⚠ For development only — re-enable before going to production.
-- ============================================================

-- Option 1: Update auth config directly (works on hosted Supabase)
UPDATE auth.config
SET mailer_autoconfirm = true
WHERE id = 1;

-- Verify the change
SELECT mailer_autoconfirm FROM auth.config WHERE id = 1;
