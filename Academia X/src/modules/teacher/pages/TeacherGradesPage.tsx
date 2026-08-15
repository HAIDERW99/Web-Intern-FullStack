/**
 * TeacherGradesPage Component
 * Full Grades management portal for teachers with course/assignment filters,
 * student submission grading, score inputs, and Supabase persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  RefreshCw,
  Search,
  Award,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import {
  getTeacherCourses,
  getTeacherAssignments,
  getSubmissionsForGrading,
  saveSubmissionGrade,
} from '@services/teacher.service';
import type {
  TeacherCourse,
  AssignmentOption,
  SubmissionGradeItem,
} from '@services/teacher.service';

export default function TeacherGradesPage() {
  const { user } = useAuth();
  const teacherId = user?.id ?? '';

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionGradeItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [rawSearch, setRawSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const search = useDebounce(rawSearch, 250);

  // 1. Load teacher assigned courses
  useEffect(() => {
    if (!teacherId) return;
    setLoadingCourses(true);
    getTeacherCourses(teacherId)
      .then((cList) => {
        setCourses(cList || []);
        if (cList && cList.length > 0) {
          setSelectedCourseId(cList[0].id);
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [teacherId]);

  // 2. Load assignments when selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setAssignments([]);
      setSelectedAssignmentId('');
      return;
    }
    setLoadingAssignments(true);
    getTeacherAssignments(selectedCourseId)
      .then((aList) => {
        setAssignments(aList || []);
        if (aList && aList.length > 0) {
          setSelectedAssignmentId(aList[0].id);
        } else {
          setSelectedAssignmentId('');
          setSubmissions([]);
        }
      })
      .catch(() => {
        setAssignments([]);
        setSelectedAssignmentId('');
      })
      .finally(() => setLoadingAssignments(false));
  }, [selectedCourseId]);

  // 3. Load submissions when selected assignment changes
  const loadSubmissions = useCallback(async () => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      return;
    }
    setLoadingSubmissions(true);
    setError(null);
    try {
      const data = await getSubmissionsForGrading(selectedAssignmentId);
      setSubmissions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions.');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleScoreChange = (studentId: string, valStr: string) => {
    const val = valStr === '' ? null : Number(valStr);
    setSubmissions((prev) =>
      (prev || []).map((item) => {
        if (item.student_id === studentId) {
          const boundedScore = val === null ? null : Math.max(0, Math.min(item.max_score, val));
          return {
            ...item,
            score: boundedScore,
            status: boundedScore !== null ? 'graded' : item.submitted_at ? 'pending' : 'missing',
          };
        }
        return item;
      }),
    );
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignmentId || !(submissions || []).length) return;
    setSaving(true);
    setError(null);
    setToastMsg(null);
    try {
      const gradePromises = (submissions || []).map((item) => {
        if (item.score !== null && item.score !== undefined) {
          return saveSubmissionGrade(
            item.submission_id,
            item.assignment_id,
            item.student_id,
            item.score,
          );
        }
        return Promise.resolve();
      });

      await Promise.all(gradePromises);
      setToastMsg({ type: 'success', text: 'Student grades saved successfully!' });
      setTimeout(() => setToastMsg(null), 3500);
      loadSubmissions();
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save grades.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Safe client-side search filtering
  const filteredSubmissions = (submissions || []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (item?.student_name ?? '').toLowerCase();
    const email = (item?.student_email ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const gradedCount = (submissions || []).filter((s) => s.status === 'graded').length;
  const pendingCount = (submissions || []).filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Grade Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review assignment submissions, record scores, and post grades to Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveGrades}
          disabled={saving || loadingSubmissions || !(submissions || []).length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 self-start"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Grades'}
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center justify-between ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-xs underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Course & Assignment Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Course Select */}
          <div className="space-y-1.5">
            <label htmlFor="grades-course-select" className="block text-sm font-medium text-slate-700">
              Assigned Course
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="grades-course-select"
                value={selectedCourseId}
                disabled={loadingCourses}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500"
              >
                {loadingCourses ? (
                  <option value="">Loading courses...</option>
                ) : courses.length === 0 ? (
                  <option value="">No courses assigned</option>
                ) : (
                  (courses || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Assignment Select */}
          <div className="space-y-1.5">
            <label htmlFor="grades-assignment-select" className="block text-sm font-medium text-slate-700">
              Select Assignment
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="grades-assignment-select"
                value={selectedAssignmentId}
                disabled={loadingAssignments || assignments.length === 0}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500 disabled:opacity-60"
              >
                {loadingAssignments ? (
                  <option value="">Loading assignments...</option>
                ) : assignments.length === 0 ? (
                  <option value="">No assignments found for course</option>
                ) : (
                  (assignments || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} (Max Score: {a.max_score})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-500">
            <Award className="w-4 h-4 text-blue-600" />
            Max Assignment Score: <span className="font-bold text-slate-800">{selectedAssignment?.max_score ?? 100}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Graded: {gradedCount}
            </span>
            <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Pending Review: {pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Submissions Roster ({selectedAssignment?.title ?? 'Select Assignment'})
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search student..."
              aria-label="Search student grades"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loadingSubmissions ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={loadSubmissions} className="text-xs underline font-semibold">Retry</button>
          </div>
        ) : (filteredSubmissions || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No student submissions found for this assignment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Submission Status</th>
                  <th className="py-3 px-4 text-right">Grade Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Safe array mapping */}
                {(filteredSubmissions || []).map((item) => {
                  const maxVal = item.max_score || 100;
                  return (
                    <tr key={item.student_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center">
                            {item.student_name[0]?.toUpperCase()}
                          </div>
                          {item.student_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {item.student_email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'graded' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Graded
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {item.status === 'missing' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3" /> Not Submitted
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={maxVal}
                            value={item.score ?? ''}
                            onChange={(e) => handleScoreChange(item.student_id, e.target.value)}
                            placeholder="0"
                            className="w-16 px-2 py-1 rounded border border-slate-200 text-right text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-slate-400 font-medium">/ {maxVal}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
