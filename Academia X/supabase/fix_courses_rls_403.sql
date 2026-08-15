-- =============================================================================
-- FIX 403 FORBIDDEN ERROR ON SUPABASE COURSES TABLE
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. Enable RLS on courses table (if not already enabled)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts or duplicate errors
DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
DROP POLICY IF EXISTS "Allow authenticated read on courses" ON public.courses;

-- 3. Allow authenticated admins and super admins full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Allow all authenticated users (teachers, students) to view courses
CREATE POLICY "Authenticated users can view courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- 5. Grant table permissions
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
