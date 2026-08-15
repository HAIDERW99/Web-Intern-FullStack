-- =============================================================================
-- FIX: Assignments Table Schema Alignment, Due_Date, Created_By & Batch_ID Constraints
-- Run this in Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- 1. Create assignments table aligned with frontend payload
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    total_marks NUMERIC(5,2) DEFAULT 100,
    max_score NUMERIC(5,2) DEFAULT 100,  -- alias column for compatibility
    due_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add missing columns and drop NOT NULL constraints on due_date, created_by & batch_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='course_id') THEN
        ALTER TABLE public.assignments ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='due_date') THEN
        ALTER TABLE public.assignments ADD COLUMN due_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
    ELSE
        ALTER TABLE public.assignments ALTER COLUMN due_date DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='created_by') THEN
        ALTER TABLE public.assignments ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ELSE
        ALTER TABLE public.assignments ALTER COLUMN created_by DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='batch_id') THEN
        ALTER TABLE public.assignments ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
    ELSE
        ALTER TABLE public.assignments ALTER COLUMN batch_id DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='teacher_id') THEN
        ALTER TABLE public.assignments ADD COLUMN teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='total_marks') THEN
        ALTER TABLE public.assignments ADD COLUMN total_marks NUMERIC(5,2) DEFAULT 100;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='max_score') THEN
        ALTER TABLE public.assignments ADD COLUMN max_score NUMERIC(5,2) DEFAULT 100;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='description') THEN
        ALTER TABLE public.assignments ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='file_url') THEN
        ALTER TABLE public.assignments ADD COLUMN file_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='updated_at') THEN
        ALTER TABLE public.assignments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 4. Drop all old conflicting policies
DROP POLICY IF EXISTS "Full access for authenticated users on assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can delete assignments" ON public.assignments;

-- 5. Create clean RLS policies
CREATE POLICY "Teachers can insert assignments"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view assignments"
ON public.assignments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Teachers can update assignments"
ON public.assignments FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Teachers can delete assignments"
ON public.assignments FOR DELETE TO authenticated
USING (true);

-- 6. Grant permissions
GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
