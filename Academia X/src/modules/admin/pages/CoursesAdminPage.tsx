/**
 * CoursesAdminPage — Screen 8
 * Course & Batch Management: card grid from live Supabase data,
 * create/edit modals with teacher assignment, delete confirmation.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
} from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Layers,
  RefreshCw,
  X,
  AlignLeft,
  ChevronDown,
  Tag,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Skeleton } from '@components/common/Skeleton';
import { useDebounce } from '@hooks/useDebounce';
import {
  getCoursesWithDetails,
  getTeachersForSelect,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@services/admin.service';
import type { CourseWithDetails } from '@services/admin.service';
import { getInitials } from '@lib/utils';

// ── Tiny Toast ────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; type: 'success' | 'error' }
let _tid = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const show = useCallback((text: string, type: ToastMsg['type'] = 'success') => {
    const id = ++_tid;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastList({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  return (
    <div aria-live="assertive" className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} role="alert"
          className={[
            'flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border',
            'animate-in slide-in-from-bottom-2 fade-in duration-200',
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800',
          ].join(' ')}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Shared form primitives ────────────────────────────────────────────────────

const INPUT_CLS = [
  'w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white',
  'text-slate-800 text-sm placeholder:text-slate-400',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors',
].join(' ');

const PLAIN_INPUT_CLS = [
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white',
  'text-slate-800 text-sm placeholder:text-slate-400',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors',
].join(' ');

function FormField({
  id,
  label,
  error,
  children,
}: {
  id:       string;
  label:    string;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title:    string;
  subtitle?: string;
  onClose:  () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Course Zod schema ─────────────────────────────────────────────────────────

const courseSchema = z.object({
  title:       z.string().min(2, 'Title must be at least 2 characters'),
  code:        z.string().min(1, 'Course code is required'),
  description: z.string().max(300, 'Max 300 characters').optional(),
  teacher_id:  z.string().min(1, 'Assign a teacher'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

// ── Teacher select ────────────────────────────────────────────────────────────

type TeacherOption = { id: string; full_name: string; avatar_url: string | null };

interface TeacherSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  teachers:   TeacherOption[];
  isLoading?: boolean;
}

const TeacherSelect = forwardRef<HTMLSelectElement, TeacherSelectProps>(
  ({ teachers, isLoading, className, ...props }, ref) => (
    <div className="relative">
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
      <select
        ref={ref}
        disabled={isLoading}
        className={[
          PLAIN_INPUT_CLS,
          'appearance-none pr-9',
          isLoading ? 'opacity-60 cursor-wait' : '',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        <option value="">
          {isLoading ? 'Loading teachers…' : 'Select a teacher'}
        </option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>{t.full_name}</option>
        ))}
      </select>
    </div>
  ),
);
TeacherSelect.displayName = 'TeacherSelect';

// ── Create / Edit Course Modal ────────────────────────────────────────────────

function CourseModal({
  mode,
  course,
  onClose,
  onSuccess,
}: {
  mode:      'create' | 'edit';
  course?:   CourseWithDetails;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [teachers,        setTeachers]        = useState<TeacherOption[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [serverError,     setServerError]     = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: mode === 'edit' && course
      ? {
          title:       course.title,
          code:        course.code ?? 'CRS-101',
          description: course.description ?? '',
          teacher_id:  course.teacher_id,
        }
      : {
          code: `CRS-${Math.floor(100 + Math.random() * 900)}`,
        },
  });

  useEffect(() => {
    getTeachersForSelect()
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
  }, []);

  const onSubmit = async (data: CourseFormValues) => {
    setServerError(null);
    try {
      const courseCode = (data.code ?? '').trim();
      if (mode === 'create') {
        await createCourse({
          title:       data.title.trim(),
          code:        courseCode,
          description: data.description ?? '',
          teacher_id:  data.teacher_id,
        });
      } else if (course) {
        await updateCourse({
          id:          course.id,
          title:       data.title.trim(),
          code:        courseCode,
          description: data.description ?? '',
          teacher_id:  data.teacher_id,
        });
      }
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Operation failed.');
    }
  };

  const isCreate = mode === 'create';

  return (
    <ModalShell
      title={isCreate ? 'Create New Course' : 'Edit Course'}
      subtitle={isCreate ? 'Add a course and assign a lead instructor.' : undefined}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <FormField id="cf-title" label="Course Title" error={errors.title?.message}>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input id="cf-title" type="text" placeholder="e.g. Web Development"
              aria-invalid={!!errors.title}
              className={INPUT_CLS}
              {...register('title')} />
          </div>
        </FormField>

        <FormField id="cf-code" label="Course Code" error={errors.code?.message}>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input id="cf-code" type="text" placeholder="e.g. CS-101"
              aria-invalid={!!errors.code}
              className={INPUT_CLS}
              {...register('code')} />
          </div>
        </FormField>

        <FormField id="cf-desc" label="Description (optional)" error={errors.description?.message}>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <textarea id="cf-desc" rows={3} placeholder="Brief course description…"
              aria-invalid={!!errors.description}
              className={[PLAIN_INPUT_CLS, 'pl-10 resize-none'].join(' ')}
              {...register('description')} />
          </div>
        </FormField>

        <FormField id="cf-teacher" label="Lead Instructor" error={errors.teacher_id?.message}>
          <TeacherSelect
            id="cf-teacher"
            teachers={teachers}
            isLoading={teachersLoading}
            aria-invalid={!!errors.teacher_id}
            {...register('teacher_id')}
          />
        </FormField>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {isSubmitting ? <><Spinner />{isCreate ? 'Creating…' : 'Saving…'}</> : (isCreate ? 'Create Course' : 'Save Changes')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Delete Course Modal ───────────────────────────────────────────────────────

function DeleteCourseModal({
  course,
  onClose,
  onSuccess,
}: {
  course:    CourseWithDetails;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleDelete = async () => {
    setServerError(null);
    setLoading(true);
    try {
      await deleteCourse(course.id);
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to delete course.');
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Delete Course" onClose={onClose}>
      <div className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              Delete <span className="font-semibold">"{course.title}"</span>?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              This will remove the course and all its enrollment records. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Spinner />Deleting…</> : 'Delete Course'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course:   CourseWithDetails;
  onEdit:   (c: CourseWithDetails) => void;
  onDelete: (c: CourseWithDetails) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const teacherInitials = getInitials(course.teacher_name);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        {/* Code & Status badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {course.code ?? 'CRS-101'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            {course.status ?? 'Active'}
          </span>
        </div>

        {/* Action menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Course actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
              <button role="menuitem" type="button"
                onClick={() => { setMenuOpen(false); onEdit(course); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Pencil className="w-4 h-4 text-slate-400" aria-hidden="true" />
                Edit
              </button>
              <button role="menuitem" type="button"
                onClick={() => { setMenuOpen(false); onDelete(course); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 leading-tight">{course.title}</h3>

      {/* Lead instructor */}
      <div className="flex items-center gap-2.5">
        {course.teacher_avatar ? (
          <img
            src={course.teacher_avatar}
            alt={course.teacher_name}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
            {teacherInitials}
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Lead Instructor
          </p>
          <p className="text-sm font-medium text-slate-800">{course.teacher_name}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Batches</p>
            <p className="text-sm font-semibold text-slate-800">—</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <Users className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Students</p>
            <p className="text-sm font-semibold text-slate-800">
              {course.enrolled_count} Enrolled
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onEdit(course)}
          className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          View Batches
        </button>
      </div>
    </div>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" aria-hidden="true">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="flex-1 h-9 rounded-lg" />
      </div>
    </div>
  );
}

// ── Modal state type ──────────────────────────────────────────────────────────

type ModalState =
  | { type: 'create-course' }
  | { type: 'edit-course';   course: CourseWithDetails }
  | { type: 'delete-course'; course: CourseWithDetails }
  | null;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoursesAdminPage() {
  const [courses,    setCourses]    = useState<CourseWithDetails[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [rawSearch,  setRawSearch]  = useState('');
  const [modal,      setModal]      = useState<ModalState>(null);

  const search = useDebounce(rawSearch, 250);
  const { toasts, show: showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCoursesWithDetails();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMutationSuccess = (msg: string) => {
    setModal(null);
    showToast(msg, 'success');
    load();
  };

  // Client-side filter by search
  const filtered = courses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const codeStr = (c.code ?? '').toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      codeStr.includes(q) ||
      c.teacher_name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-full space-y-5 pb-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Course &amp; Batch Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage institutional courses, student enrollments, and teaching assignments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create Batch
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: 'create-course' })}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create Course
          </button>
        </div>
      </div>

      {/* ── Search + stats bar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search courses or instructors…"
            aria-label="Search courses"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {!loading && (
            <span className="text-xs text-slate-500 tabular-nums">
              {filtered.length} course{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Refresh courses"
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error} —{' '}
          <button onClick={load} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* ── Card Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100">
            <BookOpen className="w-7 h-7 text-slate-400" aria-hidden="true" />
          </div>
          <p className="text-base font-medium text-slate-600">
            {rawSearch ? `No courses matching "${rawSearch}"` : 'No courses yet'}
          </p>
          {!rawSearch && (
            <button
              type="button"
              onClick={() => setModal({ type: 'create-course' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors mt-1"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create your first course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={(c)   => setModal({ type: 'edit-course',   course: c })}
              onDelete={(c) => setModal({ type: 'delete-course', course: c })}
            />
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {modal?.type === 'create-course' && (
        <CourseModal
          mode="create"
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess('Course created successfully.')}
        />
      )}
      {modal?.type === 'edit-course' && (
        <CourseModal
          mode="edit"
          course={modal.course}
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess('Course updated successfully.')}
        />
      )}
      {modal?.type === 'delete-course' && (
        <DeleteCourseModal
          course={modal.course}
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess('Course deleted successfully.')}
        />
      )}

      {/* ── Toast notifications ──────────────────────────────────────── */}
      <ToastList toasts={toasts} />
    </div>
  );
}
