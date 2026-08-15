-- =============================================================================
-- FIX & ALIGN COURSES TABLE SCHEMA AND RLS POLICIES
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. Ensure table public.courses exists with full schema fields
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    duration TEXT,
    status TEXT DEFAULT 'active',
    teacher_id UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns safely if the table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'code') THEN
        ALTER TABLE public.courses ADD COLUMN code TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'description') THEN
        ALTER TABLE public.courses ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'duration') THEN
        ALTER TABLE public.courses ADD COLUMN duration TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'status') THEN
        ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'teacher_id') THEN
        ALTER TABLE public.courses ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_by') THEN
        ALTER TABLE public.courses ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
        ALTER TABLE public.courses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Enable RLS and grant full access to authenticated users
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
DROP POLICY IF EXISTS "Allow full access for authenticated users on courses" ON public.courses;

CREATE POLICY "Allow full access for authenticated users on courses"
ON public.courses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
