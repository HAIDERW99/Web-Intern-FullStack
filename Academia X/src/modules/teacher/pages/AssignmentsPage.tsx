/**
 * Teacher AssignmentsPage — Create assignments and grade student submissions.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, ChevronDown, RefreshCw, ClipboardList, Eye,
  Save, ExternalLink, CheckCircle2, Clock, FileText, Award,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import {
  getTeacherCourses, getTeacherAssignments, createAssignment,
  getSubmissionsForAssignment, gradeSubmission, getBatchesForCourse,
} from '@services/teacher.service';
import type { TeacherCourse, AssignmentOption, AssignmentSubmission, BatchOption } from '@services/teacher.service';

type ModalMode = 'create' | 'submissions' | null;

const getDefaultDueDate = () => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const teacherId = user?.id ?? '';

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create modal
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentOption | null>(null);

  // Create form state (default due_date to 7 days from now)
  const [createForm, setCreateForm] = useState({ title: '', description: '', max_score: 100, due_date: getDefaultDueDate() });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Submissions modal state
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [grades, setGrades] = useState<Record<string, { marks: number; feedback: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Load courses
  useEffect(() => {
    if (!teacherId) return;
    setLoadingCourses(true);
    getTeacherCourses(teacherId)
      .then((c) => {
        setCourses(c || []);
        if (c && c.length > 0) setSelectedCourseId(c[0].id);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [teacherId]);

  // Load batches when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setSelectedBatchId('');
      return;
    }
    setLoadingBatches(true);
    getBatchesForCourse(selectedCourseId)
      .then((bList) => {
        setBatches(bList || []);
        if (bList && bList.length > 0) {
          setSelectedBatchId(bList[0].id);
        } else {
          setSelectedBatchId('');
        }
      })
      .catch(() => {
        setBatches([]);
        setSelectedBatchId('');
      })
      .finally(() => setLoadingBatches(false));
  }, [selectedCourseId]);

  // Load assignments when course changes
  const loadAssignments = useCallback(async () => {
    if (!selectedCourseId) { setAssignments([]); return; }
    setLoadingAssignments(true);
    try {
      const data = await getTeacherAssignments(selectedCourseId);
      setAssignments(data || []);
    } catch { setAssignments([]); }
    finally { setLoadingAssignments(false); }
  }, [selectedCourseId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const handleCreate = async () => {
    // Pre-flight validation
    if (!selectedCourseId) {
      setCreateError('Please select a course before creating an assignment.');
      return;
    }
    if (!teacherId) {
      setCreateError('Your session is missing. Please log out and log back in.');
      return;
    }
    if (!createForm.title.trim()) {
      setCreateError('Assignment title is required.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createAssignment({
        course_id:   selectedCourseId,
        batch_id:    selectedBatchId || null,
        teacher_id:  teacherId,
        title:       createForm.title.trim(),
        description: createForm.description.trim(),
        max_score:   Number(createForm.max_score) || 100,
        due_date:    createForm.due_date
          ? new Date(createForm.due_date).toISOString()
          : '',
      });
      setToastMsg({ type: 'success', text: 'Assignment created successfully!' });
      setTimeout(() => setToastMsg(null), 3500);
      setModal(null);
      setCreateForm({ title: '', description: '', max_score: 100, due_date: getDefaultDueDate() });
      loadAssignments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment.';
      setCreateError(msg);
      setToastMsg({ type: 'error', text: msg });
    } finally {
      setCreating(false);
    }
  };

  const openSubmissions = async (assignment: AssignmentOption) => {
    setSelectedAssignment(assignment);
    setModal('submissions');
    setLoadingSubs(true);
    try {
      const data = await getSubmissionsForAssignment(assignment.id);
      setSubmissions(data || []);
      const initGrades: Record<string, { marks: number; feedback: string }> = {};
      (data || []).forEach((s) => {
        initGrades[s.id] = { marks: s.obtained_marks ?? 0, feedback: s.feedback ?? '' };
      });
      setGrades(initGrades);
    } catch { setSubmissions([]); }
    finally { setLoadingSubs(false); }
  };

  const handleGrade = async (submissionId: string) => {
    const g = grades[submissionId];
    if (!g) return;
    setSaving((prev) => ({ ...prev, [submissionId]: true }));
    try {
      await gradeSubmission(submissionId, g.marks, g.feedback);
      setSubmissions((prev) =>
        prev.map((s) => s.id === submissionId
          ? { ...s, obtained_marks: g.marks, feedback: g.feedback, status: 'graded' }
          : s));
      setToastMsg({ type: 'success', text: 'Submission graded!' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({ type: 'error', text: err instanceof Error ? err.message : 'Grading failed.' });
    } finally {
      setSaving((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assignments Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create assignments for your courses and grade student submissions.</p>
        </div>
        <button onClick={() => { setModal('create'); setCreateError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm self-start">
          <Plus className="w-4 h-4" />New Assignment
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div role="status" className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center justify-between ${toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-xs underline font-semibold">Dismiss</button>
        </div>
      )}

      {/* Course Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select value={selectedCourseId} disabled={loadingCourses}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500">
            {loadingCourses ? <option>Loading courses...</option>
              : courses.length === 0 ? <option>No courses assigned</option>
              : (courses || []).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
        </div>
        <button onClick={loadAssignments} disabled={loadingAssignments}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loadingAssignments ? 'animate-spin' : ''}`} />Refresh
        </button>
        <span className="text-xs text-slate-500 tabular-nums">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Assignments List */}
      {loadingAssignments ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-slate-200 rounded-xl">
          <div className="p-3 rounded-full bg-slate-100"><ClipboardList className="w-8 h-8 text-slate-400" /></div>
          <p className="text-sm font-medium text-slate-600">No assignments created for this course yet.</p>
          <button onClick={() => setModal('create')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
            Create First Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(assignments || []).map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{a?.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Max: {a.max_score} marks</span>
                </div>
              </div>
              <button onClick={() => openSubmissions(a)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors whitespace-nowrap">
                <Eye className="w-4 h-4" />View Submissions
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Create New Assignment</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {createError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</div>}

              {/* Course Selector */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Course *</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500">
                    {(courses || []).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
                  </select>
                </div>
              </div>

              {/* Batch Selector */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Target Batch <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={loadingBatches}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm appearance-none pr-9 focus:outline-none focus:border-blue-500 disabled:opacity-60">
                    {loadingBatches ? (
                      <option value="">Loading batches...</option>
                    ) : batches.length === 0 ? (
                      <option value="">No batches for this course</option>
                    ) : (
                      <>
                        <option value="">All Batches / General</option>
                        {(batches || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Assignment Title *</label>
                <input type="text" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 5 Problem Set" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Description / Instructions</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Assignment instructions or objectives…"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Total Marks</label>
                  <input type="number" min={1} max={1000} value={createForm.max_score}
                    onChange={(e) => setCreateForm((f) => ({ ...f, max_score: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Due Date</label>
                  <input type="datetime-local" value={createForm.due_date}
                    onChange={(e) => setCreateForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between bg-slate-50">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Review Modal */}
      {modal === 'submissions' && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <p className="text-xs text-slate-500 font-medium">Submissions for</p>
                <h2 className="text-lg font-bold text-slate-900">{selectedAssignment.title}</h2>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingSubs ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
              ) : (submissions || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No submissions received yet.</p>
                </div>
              ) : (
                (submissions || []).map((s) => (
                  <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {s.student_name[0]?.toUpperCase()}
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">{s.student_name}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 ml-9">{s.student_email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.status === 'graded'
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Graded</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>}
                        {s.file_url && (
                          <a href={s.file_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                            <ExternalLink className="w-3 h-3" />Download
                          </a>
                        )}
                      </div>
                    </div>

                    {s.notes && (
                      <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <strong>Notes:</strong> {s.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Obtained Marks (/{selectedAssignment.max_score})</label>
                        <input type="number" min={0} max={selectedAssignment.max_score}
                          value={grades[s.id]?.marks ?? 0}
                          onChange={(e) => setGrades((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: Number(e.target.value) } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Feedback to Student</label>
                        <input type="text" placeholder="e.g. Well done! Improve conclusion."
                          value={grades[s.id]?.feedback ?? ''}
                          onChange={(e) => setGrades((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => handleGrade(s.id)} disabled={saving[s.id]}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                        {saving[s.id] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving[s.id] ? 'Saving…' : 'Save Grade'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
