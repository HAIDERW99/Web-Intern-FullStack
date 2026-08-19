-- ====================================================================
-- HostHaven: Fix Supabase 500 "Database error saving new user" Error
-- ====================================================================
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- 1. Ensure user_role ENUM type exists (if used in database)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'hotel_owner', 'admin');
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Drop existing trigger and function to clean up broken versions
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create a fault-tolerant handle_new_user function
-- This function extracts full_name, role, and phone from user metadata.
-- Exception handling ensures auth signup NEVER fails even if profile creation hits an edge case.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Extract role from metadata passed during signup, default to 'customer'
  user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  BEGIN
    -- Try inserting into profiles with user_role enum casting
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
      NEW.id,
      user_role_val::user_role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: If enum cast fails or profiles role is text column
    BEGIN
      INSERT INTO public.profiles (id, role, full_name, phone)
      VALUES (
        NEW.id,
        user_role_val,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'phone'
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Log warning but DO NOT crash auth.users insertion
      RAISE WARNING 'Could not auto-create profile for user %: %', NEW.id, SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the trigger on auth.users table
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
