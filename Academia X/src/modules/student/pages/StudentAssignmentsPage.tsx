/**
 * StudentAssignmentsPage — List assignments with submission modal for file upload and notes.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, Upload, FileText, CheckCircle2, Clock,
  XCircle, X, RefreshCw, Award, Search, ExternalLink,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import {
  getStudentAssignments, submitAssignment, uploadSubmissionFile,
} from '@services/student.service';
import type { AssignmentItem } from '@services/student.service';

type StatusFilter = 'all' | 'pending' | 'submitted' | 'graded';

function StatusBadge({ status }: { status: AssignmentItem['status'] }) {
  if (status === 'graded')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Graded</span>;
  if (status === 'submitted')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><FileText className="w-3 h-3" />Submitted</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" />Pending</span>;
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const studentId = user?.id ?? '';

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 250);

  // Modal state
  const [modalItem, setModalItem] = useState<AssignmentItem | null>(null);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssignments = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentAssignments(studentId);
      setAssignments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const openModal = (item: AssignmentItem) => {
    setModalItem(item);
    setNotes(item.feedback ?? '');
    setFile(null);
    setModalError(null);
  };
  const closeModal = () => { setModalItem(null); setFile(null); setNotes(''); };

  const handleSubmit = async () => {
    if (!modalItem) return;
    setSubmitting(true);
    setModalError(null);
    try {
      let fileUrl: string | null = modalItem.file_url ?? null;
      if (file) {
        setUploading(true);
        fileUrl = await uploadSubmissionFile(file, studentId, modalItem.id);
        setUploading(false);
      }
      await submitAssignment({
        assignment_id: modalItem.id,
        student_id: studentId,
        file_url: fileUrl,
        notes,
        submission_id: modalItem.submission_id,
      });
      setToastMsg({ type: 'success', text: 'Assignment submitted successfully!' });
      setTimeout(() => setToastMsg(null), 3500);
      closeModal();
      loadAssignments();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const filtered = (assignments || []).filter((a) => {
    const matchesFilter = filter === 'all' || a.status === filter;
    if (!search.trim()) return matchesFilter;
    const q = search.toLowerCase();
    return matchesFilter && (
      (a?.title ?? '').toLowerCase().includes(q) ||
      (a?.course_title ?? '').toLowerCase().includes(q)
    );
  });

  const isOverdue = (dueDate: string | null) =>
    dueDate && new Date(dueDate) < new Date();

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">View, submit, and track all course assignments.</p>
        </div>
        <button onClick={loadAssignments} disabled={loading} aria-label="Refresh"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 self-start">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div role="status" className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center justify-between ${toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-xs underline font-semibold">Dismiss</button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200">
          {(['all', 'pending', 'submitted', 'graded'] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="search" value={rawSearch} onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search assignments…" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadAssignments} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* Assignment Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <Skeleton className="h-5 w-56" /><Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-slate-200 rounded-xl">
          <div className="p-3 rounded-full bg-slate-100 text-slate-400"><ClipboardList className="w-8 h-8" /></div>
          <p className="text-sm font-medium text-slate-600">No assignments found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(filtered || []).map((a) => (
            <div key={a?.id ?? Math.random()}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={a.status} />
                    {isOverdue(a.due_date) && a.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3" />Overdue
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">{a.course_title}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{a?.title ?? 'Untitled'}</h3>
                  {a.description && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{a.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Max: {a.max_score} marks</span>
                    {a.score !== null && a.score !== undefined && (
                      <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Score: {a.score}/{a.max_score}</span>
                    )}
                    {a.due_date && (
                      <span className={`flex items-center gap-1 ${isOverdue(a.due_date) && a.status === 'pending' ? 'text-red-600' : ''}`}>
                        <Clock className="w-3.5 h-3.5" />Due: {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {a.feedback && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-800"><strong>Feedback:</strong> {a.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <ExternalLink className="w-3.5 h-3.5" />Assignment File
                    </a>
                  )}
                  {a.status !== 'graded' && (
                    <button onClick={() => openModal(a)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {a.status === 'submitted' ? 'Resubmit' : 'Submit'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <p className="text-xs text-slate-500 font-medium">{modalItem.course_title}</p>
                <h2 className="text-lg font-bold text-slate-900">{modalItem.title}</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {modalError}
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Submission File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">
                    {file ? file.name : 'Click to upload file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, ZIP (max 10MB)</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {modalItem.submitted_at && (
                  <p className="text-xs text-slate-400">Previously submitted: {new Date(modalItem.submitted_at).toLocaleString()}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="submission-notes" className="block text-sm font-medium text-slate-700">
                  Notes / Submission Link <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea id="submission-notes" value={notes}
                  onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder="Add any notes or paste a Google Drive / GitHub link…"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting || uploading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
