-- ====================================================================
-- HostHaven: Backfill Missing Profiles & Fix RLS Policies (HTTP 406 Fix)
-- ====================================================================
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- 1. Ensure user_role ENUM type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'hotel_owner', 'admin');
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Backfill existing registered users from auth.users into public.profiles
INSERT INTO public.profiles (id, role, full_name, phone)
SELECT 
  id, 
  COALESCE((raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  raw_user_meta_data->>'phone'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

-- 3. Enable RLS on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Clean up old conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.profiles;

-- 5. Create clean working RLS policies
CREATE POLICY "Allow select for authenticated" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update for authenticated" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);
