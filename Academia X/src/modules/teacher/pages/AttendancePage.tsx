/**
 * AttendancePage Component
 * Full attendance marking portal for teachers with course selection, date picker,
 * bulk quick actions, and Supabase persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Save,
  CheckCheck,
  Ban,
  Calendar,
  ChevronDown,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import {
  getTeacherCourses,
  getAttendanceRoster,
  saveAttendanceRecords,
} from '@services/teacher.service';
import type { TeacherCourse, StudentAttendanceRow } from '@services/teacher.service';

export default function AttendancePage() {
  const { user } = useAuth();
  const teacherId = user?.id ?? '';

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<StudentAttendanceRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load teacher's assigned courses
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

  // Load roster when selected course or date changes
  const loadRoster = useCallback(async () => {
    if (!selectedCourseId) return;
    setLoadingRoster(true);
    setError(null);
    try {
      const data = await getAttendanceRoster(selectedCourseId, date);
      setRoster(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student roster.');
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedCourseId, date]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const handleStatusChange = (
    studentId: string,
    newStatus: StudentAttendanceRow['attendance_status'],
  ) => {
    setRoster((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendance_status: newStatus } : s)),
    );
  };

  const handleMarkAll = (status: StudentAttendanceRow['attendance_status']) => {
    setRoster((prev) => prev.map((s) => ({ ...s, attendance_status: status })));
  };

  const handleSave = async () => {
    if (!selectedCourseId || !roster.length) return;
    setSaving(true);
    setError(null);
    setToastMsg(null);
    try {
      const records = roster.map((r) => ({
        course_id:  selectedCourseId,
        student_id: r.id,
        date,
        status:     r.attendance_status,
        marked_by:  teacherId,
      }));
      await saveAttendanceRecords(records);
      setToastMsg({ type: 'success', text: `Attendance for ${date} saved successfully!` });
      setTimeout(() => setToastMsg(null), 3500);
      loadRoster();
    } catch (err) {
      setToastMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const counts = {
    present: roster.filter((r) => r.attendance_status === 'present').length,
    absent:  roster.filter((r) => r.attendance_status === 'absent').length,
    late:    roster.filter((r) => r.attendance_status === 'late').length,
    leave:   roster.filter((r) => r.attendance_status === 'leave').length,
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record daily student presence, mark leaves, and sync attendance to Supabase.
          </p>
        </div>

        {/* Save & Sync Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingRoster || !roster.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 self-start"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Toast Banner */}
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

      {/* Course & Date Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Course Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="att-course-select" className="block text-sm font-medium text-slate-700">
              Select Assigned Course
            </label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="att-course-select"
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
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label htmlFor="att-date-picker" className="block text-sm font-medium text-slate-700">
              Attendance Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="att-date-picker"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Bulk Actions & Summary Pills */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Quick Actions:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              disabled={loadingRoster || !roster.length}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Present
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              disabled={loadingRoster || !roster.length}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              Mark All Absent
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold tabular-nums">
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Present: {counts.present}
            </span>
            <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Absent: {counts.absent}
            </span>
            <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Late: {counts.late}
            </span>
            <span className="text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              Leave: {counts.leave}
            </span>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Student Roster — {selectedCourse?.title ?? 'Selected Course'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {roster.length} Student{roster.length !== 1 ? 's' : ''} Enrolled
          </span>
        </div>

        {loadingRoster ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-64 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={loadRoster} className="text-xs underline font-semibold">Retry</button>
          </div>
        ) : (roster || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No students enrolled in this course.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(roster || []).map((student) => {
                  const status = student.attendance_status;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center">
                            {student.full_name[0]?.toUpperCase()}
                          </div>
                          {student.full_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {student.email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              status === 'late'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'leave')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              status === 'leave'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Leave
                          </button>
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
