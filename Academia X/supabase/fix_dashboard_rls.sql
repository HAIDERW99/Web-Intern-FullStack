-- =============================================================================
-- DASHBOARD TABLES RLS READ POLICIES (Fix Red Error Banner)
-- =============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> Run
-- =============================================================================

-- Ensure RLS is enabled on stats tables
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dashboard stats and activity
DROP POLICY IF EXISTS "Allow authenticated read on students" ON public.students;
CREATE POLICY "Allow authenticated read on students" ON public.students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on teachers" ON public.teachers;
CREATE POLICY "Allow authenticated read on teachers" ON public.teachers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on courses" ON public.courses;
CREATE POLICY "Allow authenticated read on courses" ON public.courses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on batches" ON public.batches;
CREATE POLICY "Allow authenticated read on batches" ON public.batches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on assignments" ON public.assignments;
CREATE POLICY "Allow authenticated read on assignments" ON public.assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "Allow authenticated read on assignment_submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on attendance" ON public.attendance;
CREATE POLICY "Allow authenticated read on attendance" ON public.attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated read on activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on notifications" ON public.notifications;
CREATE POLICY "Allow authenticated read on notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- Grant SELECT permissions
GRANT SELECT ON public.students TO authenticated;
GRANT SELECT ON public.teachers TO authenticated;
GRANT SELECT ON public.courses TO authenticated;
GRANT SELECT ON public.batches TO authenticated;
GRANT SELECT ON public.assignments TO authenticated;
GRANT SELECT ON public.assignment_submissions TO authenticated;
GRANT SELECT ON public.attendance TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
