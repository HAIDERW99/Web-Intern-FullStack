/**
 * StudentDashboard — Real-time stats from Supabase.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, CalendarCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@config/routes';
import { getStudentDashboardStats, getStudentCourses } from '@services/student.service';
import type { StudentStats, StudentCourseItem } from '@services/student.service';

function StatSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.id ?? '';

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [courses, setCourses] = useState<StudentCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        getStudentDashboardStats(studentId),
        getStudentCourses(studentId),
      ]);
      setStats(s);
      setCourses(c || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Student';

  return (
    <div className="min-h-full space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hi, {firstName}! 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Track your progress and upcoming assignments.</p>
        </div>
        <button onClick={loadData} disabled={loading} aria-label="Refresh"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><BookOpen className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats?.enrolledCourses ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Active enrollments</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Assignments</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><ClipboardList className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats?.pendingAssignments ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Awaiting submission</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CalendarCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stats?.attendanceRate ?? 0}%</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Overall presence rate</p>
            </div>
          </>
        )}
      </div>

      {/* Recent Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">My Enrolled Courses</h2>
          <button onClick={() => navigate(ROUTES.STUDENT.COURSES)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : (courses || []).length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No courses enrolled yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(courses || []).slice(0, 3).map((c) => (
              <div key={c.id} onClick={() => navigate(ROUTES.STUDENT.COURSES)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow group">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-600">{c.code}</span>
                  <span className="text-xs text-emerald-600 font-medium">{c.status}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Instructor: {c.teacher_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
