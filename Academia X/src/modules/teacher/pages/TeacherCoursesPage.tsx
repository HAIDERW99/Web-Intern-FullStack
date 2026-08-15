/**
 * TeacherCoursesPage Component
 * My Courses tab for teachers with safe array mapping, search filter, and course drawer modal.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Users,
  Clock,
  FileText,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import { getTeacherCourses, getCourseDetails } from '@services/teacher.service';
import type { TeacherCourse, CourseDetails } from '@services/teacher.service';

export function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  const teacherId = user?.id ?? '';
  const search = useDebounce(rawSearch, 250);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacherCourses(teacherId);
      setCourses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assigned courses.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleOpenDetails = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setDetailsLoading(true);
    try {
      const details = await getCourseDetails(courseId);
      setCourseDetails(details);
    } catch {
      setCourseDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCourseId(null);
    setCourseDetails(null);
  };

  // Safe client-side search filtering
  const filteredCourses = (courses || []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = (c?.title ?? '').toLowerCase();
    const code = (c?.code ?? '').toLowerCase();
    const desc = (c?.description ?? '').toLowerCase();
    return title.includes(q) || code.includes(q) || desc.includes(q);
  });

  return (
    <div className="min-h-full space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Courses &amp; Classes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your assigned teaching modules, course syllabus, and student rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCourses}
          disabled={loading}
          aria-label="Refresh courses"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm self-start disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search & Count Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search courses or code…"
            aria-label="Search courses"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {!loading && (
          <span className="text-xs text-slate-500 tabular-nums">
            {(filteredCourses || []).length} course{(filteredCourses || []).length !== 1 ? 's' : ''} assigned
          </span>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadCourses} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : (filteredCourses || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-slate-200 rounded-xl">
          <div className="p-3 rounded-full bg-slate-100 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <p className="text-base font-medium text-slate-600">
            {rawSearch ? `No courses matching "${rawSearch}"` : 'No courses assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Safe array mapping */}
          {(filteredCourses || []).map((c) => (
            <div
              key={c?.id ?? Math.random()}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {c?.code ?? 'CRS-101'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c?.status ?? 'Active'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                  {c?.title ?? 'Untitled Course'}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {c?.description || 'Institutional teaching module curriculum.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {c?.enrolled_count ?? 0} Students
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDetails(c.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  Course Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Details Modal / Drawer */}
      {selectedCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseDetails}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {courseDetails?.code ?? 'CRS-101'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {courseDetails?.title ?? 'Course Details'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  {/* Schedule & Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase text-blue-700 tracking-wider">Class Schedule</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">{courseDetails?.schedule}</p>
                        <p className="text-xs text-slate-500 mt-1">Duration: {courseDetails?.duration}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                      <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase text-purple-700 tracking-wider">Course Syllabus</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{courseDetails?.description}</p>
                        <a
                          href={courseDetails?.syllabus_url ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline mt-2"
                        >
                          View Full Document <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Students Roster */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Enrolled Student Roster ({courseDetails?.students?.length ?? 0})
                      </h3>
                    </div>

                    {(courseDetails?.students || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No students enrolled in this course yet.
                      </p>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {(courseDetails?.students || []).map((student) => (
                          <div key={student.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center">
                                {student.full_name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                                <p className="text-xs text-slate-400">{student.email}</p>
                              </div>
                            </div>
                            <span className="text-xs text-emerald-600 font-medium px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                              Enrolled
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetails}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
