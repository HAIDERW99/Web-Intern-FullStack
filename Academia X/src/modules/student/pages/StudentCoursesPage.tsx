/**
 * StudentCoursesPage — Enrolled courses list with course cards.
 */
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Users, Clock, RefreshCw, Calendar } from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import { getStudentCourses } from '@services/student.service';
import type { StudentCourseItem } from '@services/student.service';

function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<StudentCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 250);

  const studentId = user?.id ?? '';

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentCourses(studentId);
      setCourses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrolled courses.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const filtered = (courses || []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c?.title ?? '').toLowerCase().includes(q) ||
           (c?.code ?? '').toLowerCase().includes(q) ||
           (c?.teacher_name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-full space-y-5 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Enrolled Courses</h1>
          <p className="mt-1 text-sm text-slate-500">Browse all courses you are currently enrolled in.</p>
        </div>
        <button onClick={loadCourses} disabled={loading} aria-label="Refresh"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="search" value={rawSearch} onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search courses…" aria-label="Search courses"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
        </div>
        {!loading && (
          <span className="text-xs text-slate-500 tabular-nums">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} enrolled
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadCourses} className="underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-slate-200 rounded-xl">
          <div className="p-3 rounded-full bg-slate-100 text-slate-400"><BookOpen className="w-8 h-8" /></div>
          <p className="text-sm font-medium text-slate-600">
            {rawSearch ? `No courses matching "${rawSearch}"` : 'You are not enrolled in any courses yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(filtered || []).map((c) => (
            <div key={c?.id ?? Math.random()}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {c?.code ?? 'CRS-101'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c?.status ?? 'Active'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">{c?.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {c?.description || 'Institutional teaching module curriculum.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instructor: <strong>{c?.teacher_name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c?.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enrolled: {c?.enrolled_at ? new Date(c.enrolled_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
