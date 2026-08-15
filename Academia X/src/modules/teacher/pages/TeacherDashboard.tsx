/**
 * TeacherDashboard Page
 * Displays dynamic KPI stat cards, real-time class activity, and quick navigation.
 * Wired directly to Supabase via teacher.service.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { Skeleton } from '@components/common/Skeleton';
import { ROUTES } from '@config/routes';
import { getTeacherDashboardStats, getTeacherCourses } from '@services/teacher.service';
import type { TeacherStats, TeacherCourse } from '@services/teacher.service';

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const teacherId = user?.id ?? '';

  const loadData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const [sData, cData] = await Promise.all([
        getTeacherDashboardStats(teacherId),
        getTeacherCourses(teacherId),
      ]);
      setStats(sData);
      setCourses(cData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher dashboard.');
      setStats(null);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Teacher';

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Welcome Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening across your assigned classes today.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh stats"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.TEACHER.ATTENDANCE)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" aria-hidden="true" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Courses
                </span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-tight">
                {stats?.assignedCourses ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Active teaching commitments
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Students
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-tight">
                {stats?.totalStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Enrolled across all courses
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Grades
                </span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-tight">
                {stats?.pendingAssignments ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Submissions awaiting review
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attendance Rate
                </span>
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-tight">
                {stats?.todayAttendance ?? 0}%
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Overall student presence rate
              </p>
            </div>
          </>
        )}
      </div>

      {/* Courses & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Overview Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Assigned Courses</h2>
            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER.COURSES)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Courses <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : (courses || []).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No courses currently assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(courses || []).slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(ROUTES.TEACHER.COURSES)}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{c.enrolled_count} Students</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'Institutional curriculum.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER.ATTENDANCE)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Mark Attendance</p>
                  <p className="text-xs text-slate-400">Record daily student status</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER.COURSES)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">My Courses</p>
                  <p className="text-xs text-slate-400">Syllabus &amp; roster details</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.TEACHER.ASSIGNMENTS)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Review Assignments</p>
                  <p className="text-xs text-slate-400">Grade pending submissions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
