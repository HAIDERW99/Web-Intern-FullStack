-- =============================================================================
-- FIX REST API 500 ERROR ON PROFILES QUERY (RLS Infinite Recursion Fix)
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. Update helper function with SECURITY DEFINER to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Temporarily disable RLS to clear state
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies on profiles table to clear recursive loops
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins/SuperAdmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow auth admin or user to insert profile" ON public.profiles;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create non-recursive RLS policies

-- Allow authenticated users to SELECT profiles (needed for app navigation & user roles)
CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup / trigger
CREATE POLICY "Allow auth admin or user to insert profile"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 6. Grant necessary table permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;
