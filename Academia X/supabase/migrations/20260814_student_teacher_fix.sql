-- =============================================================================
-- MIGRATION: Student Submissions, Storage Bucket, RLS Policies
-- Run in Supabase SQL Editor: supabase/migrations/20260814_student_teacher_fix.sql
-- =============================================================================

-- 1. Ensure Assignments table exists with required columns
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    max_score NUMERIC(5,2) DEFAULT 100,
    due_date TIMESTAMPTZ,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='teacher_id') THEN
        ALTER TABLE public.assignments ADD COLUMN teacher_id UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='max_score') THEN
        ALTER TABLE public.assignments ADD COLUMN max_score NUMERIC(5,2) DEFAULT 100;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='due_date') THEN
        ALTER TABLE public.assignments ADD COLUMN due_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='file_url') THEN
        ALTER TABLE public.assignments ADD COLUMN file_url TEXT;
    END IF;
END $$;

-- 2. Ensure Student Submissions Table & Constraints
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_url TEXT,
    notes TEXT,
    score NUMERIC(5,2),
    obtained_marks NUMERIC(5,2),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='obtained_marks') THEN
        ALTER TABLE public.submissions ADD COLUMN obtained_marks NUMERIC(5,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='feedback') THEN
        ALTER TABLE public.submissions ADD COLUMN feedback TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='graded_at') THEN
        ALTER TABLE public.submissions ADD COLUMN graded_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Enrollments table for student-course relationships
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- 4. Storage Bucket Setup for Submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS Policies ──────────────────────────────────────────────────────────────

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access for authenticated users on assignments" ON public.assignments;
CREATE POLICY "Full access for authenticated users on assignments"
ON public.assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own submissions" ON public.submissions;
CREATE POLICY "Students manage own submissions" ON public.submissions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access for authenticated users on enrollments" ON public.enrollments;
CREATE POLICY "Full access for authenticated users on enrollments"
ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Storage Policies
DROP POLICY IF EXISTS "Authenticated users upload submissions" ON storage.objects;
CREATE POLICY "Authenticated users upload submissions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assignment-submissions');

DROP POLICY IF EXISTS "Authenticated users read submissions" ON storage.objects;
CREATE POLICY "Authenticated users read submissions"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assignment-submissions');

-- 7. Grant permissions
GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
GRANT ALL ON public.submissions TO service_role;
GRANT ALL ON public.enrollments TO service_role;
