/**
 * UsersPage — Screen 7
 * Student & Teacher management with tabbed interface, live Supabase data,
 * search/filter, full CRUD modals, pagination, and row actions.
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from 'react';
import {
  UserPlus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Users,
  GraduationCap,
  Mail,
  RefreshCw,
  X,
  Lock,
  User,
  EyeOff,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Skeleton } from '@components/common/Skeleton';
import { Pagination } from '@components/shared/Pagination';
import { useDebounce } from '@hooks/useDebounce';
import {
  getUsersList,
  createUser,
  updateUser,
  deleteUser,
} from '@services/admin.service';
import type { EnrichedProfile } from '@services/admin.service';
import type { PaginationMeta } from '@/types/common.types';
import { getInitials } from '@lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
type ActiveTab  = 'students' | 'teachers';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
});

const editSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email:     z.string().email('Enter a valid email'),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues   = z.infer<typeof editSchema>;

// ── Tiny Toast ────────────────────────────────────────────────────────────────

interface ToastMessage { id: number; text: string; type: 'success' | 'error' }
let _toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return { toasts, show };
}

function ToastList({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={[
            'flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            'border animate-in slide-in-from-bottom-2 fade-in duration-200',
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800',
          ].join(' ')}
        >
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Avatar cell ───────────────────────────────────────────────────────────────

function UserAvatar({
  name,
  avatarUrl,
}: {
  name:      string;
  avatarUrl: string | null;
}) {
  const initials = getInitials(name);
  const COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
  ];
  const idx = initials.charCodeAt(0) % COLORS.length;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${COLORS[idx]}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── Row action menu ───────────────────────────────────────────────────────────

function RowActionMenu({
  user,
  onEdit,
  onDelete,
}: {
  user:     EnrichedProfile;
  onEdit:   (u: EnrichedProfile) => void;
  onDelete: (u: EnrichedProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-400" aria-hidden="true" />
            View Profile
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => { setOpen(false); onEdit(user); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4 text-slate-400" aria-hidden="true" />
            Edit
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => { setOpen(false); onDelete(user); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateUserModal({
  role,
  onClose,
  onSuccess,
}: {
  role:      'student' | 'teacher';
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [showPwd,      setShowPwd]      = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (data: CreateFormValues) => {
    setServerError(null);
    try {
      await createUser({ ...data, role });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create user.');
    }
  };

  const label = role === 'student' ? 'Student' : 'Teacher';

  return (
    <ModalShell title={`Add New ${label}`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <FormField id="cm-name" label="Full Name" error={errors.full_name?.message}>
          <FieldInput id="cm-name" icon={User} placeholder="Jane Doe"
            autoComplete="name" {...register('full_name')} />
        </FormField>

        <FormField id="cm-email" label="Email" error={errors.email?.message}>
          <FieldInput id="cm-email" icon={Mail} placeholder="jane@institute.edu"
            type="email" autoComplete="email" {...register('email')} />
        </FormField>

        <FormField id="cm-pwd" label="Temporary Password" error={errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              id="cm-pwd"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              aria-invalid={!!errors.password}
              className={INPUT_CLS}
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPwd ? 'Hide password' : 'Show password'}>
              {showPwd ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </FormField>

        <ModalActions onCancel={onClose} submitLabel={`Create ${label}`} isLoading={isSubmitting} />
      </form>
    </ModalShell>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user:      EnrichedProfile;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: user.full_name, email: user.email },
  });

  const onSubmit = async (data: EditFormValues) => {
    setServerError(null);
    try {
      await updateUser({ id: user.id, ...data });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to update user.');
    }
  };

  return (
    <ModalShell title="Edit User" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <FormField id="em-name" label="Full Name" error={errors.full_name?.message}>
          <FieldInput id="em-name" icon={User} placeholder="Jane Doe"
            autoComplete="name" {...register('full_name')} />
        </FormField>

        <FormField id="em-email" label="Email" error={errors.email?.message}>
          <FieldInput id="em-email" icon={Mail} placeholder="jane@institute.edu"
            type="email" autoComplete="email" {...register('email')} />
        </FormField>

        <ModalActions onCancel={onClose} submitLabel="Save Changes" isLoading={isSubmitting} />
      </form>
    </ModalShell>
  );
}

// ── Confirm delete modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onClose,
  onSuccess,
}: {
  user:      EnrichedProfile;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleDelete = async () => {
    setServerError(null);
    setLoading(true);
    try {
      await deleteUser(user.id);
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to delete user.');
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        {serverError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">
              Delete <span className="font-semibold">{user.full_name}</span>?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              This will remove their profile from the database. Auth account deletion requires an Edge Function.
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
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>Deleting…</>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Shared modal primitives ───────────────────────────────────────────────────

const INPUT_CLS = [
  'w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white',
  'text-slate-800 text-sm placeholder:text-slate-400',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors',
].join(' ');

import { forwardRef } from 'react';

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id:   string;
  icon: React.ElementType;
}

const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  ({ id, icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        className={`${INPUT_CLS} ${className ?? ''}`}
        {...props}
      />
    </div>
  ),
);
FieldInput.displayName = 'FieldInput';

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
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title:    string;
  onClose:  () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
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

function ModalActions({
  onCancel,
  submitLabel,
  isLoading,
  destructive,
}: {
  onCancel:    () => void;
  submitLabel: string;
  isLoading:   boolean;
  destructive?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
        Cancel
      </button>
      <button type="submit" disabled={isLoading}
        className={[
          'flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center justify-center gap-2',
          destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700',
        ].join(' ')}>
        {isLoading ? (
          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>Saving…</>
        ) : submitLabel}
      </button>
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'create' }
  | { type: 'edit';   user: EnrichedProfile }
  | { type: 'delete'; user: EnrichedProfile }
  | null;

export default function UsersPage() {
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('students');
  const [rawSearch,  setRawSearch]  = useState('');
  const [page,       setPage]       = useState(1);
  const [users,      setUsers]      = useState<EnrichedProfile[]>([]);
  const [meta,       setMeta]       = useState<PaginationMeta | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [modal,      setModal]      = useState<ModalState>(null);

  const search     = useDebounce(rawSearch, 300);
  const { toasts, show: showToast } = useToast();

  const role = activeTab === 'students' ? 'student' : 'teacher';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsersList({ page, pageSize: PAGE_SIZE, search, role });
      setUsers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  // Reset to page 1 when tab or search changes
  useEffect(() => { setPage(1); }, [activeTab, search]);
  useEffect(() => { load(); }, [load]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setRawSearch('');
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRawSearch(e.target.value);
  };

  const handleMutationSuccess = (message: string) => {
    setModal(null);
    showToast(message, 'success');
    load();
  };

  const tabLabel = activeTab === 'students' ? 'Students' : 'Teachers';

  return (
    <div className="min-h-full space-y-5 pb-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all students, teachers, and their profiles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm self-start"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add {tabLabel === 'Students' ? 'Student' : 'Teacher'}
        </button>
      </div>

      {/* ── Tabs + Toolbar ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div
          className="flex border-b border-slate-100"
          role="tablist"
          aria-label="User type tabs"
        >
          {(['students', 'teachers'] as const).map((tab) => {
            const Icon = tab === 'students' ? Users : GraduationCap;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab)}
                className={[
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors capitalize border-b-2 -mb-px',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={rawSearch}
              onChange={handleSearchChange}
              placeholder={`Search ${tabLabel.toLowerCase()}…`}
              aria-label={`Search ${tabLabel}`}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Record count */}
            {!loading && meta && (
              <span className="text-xs text-slate-500 tabular-nums">
                {meta.total} {tabLabel.toLowerCase()}
              </span>
            )}
            {/* Refresh */}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Refresh"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error} —{' '}
            <button onClick={load} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <div
          role="tabpanel"
          aria-label={`${tabLabel} list`}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm" aria-label={`${tabLabel} table`}>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-5 font-medium text-slate-500 uppercase text-xs tracking-wider">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs tracking-wider hidden md:table-cell">
                  Joined
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 uppercase text-xs tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton cols={5} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {activeTab === 'students'
                        ? <Users className="w-8 h-8 text-slate-300" aria-hidden="true" />
                        : <GraduationCap className="w-8 h-8 text-slate-300" aria-hidden="true" />}
                      <p className="text-sm text-slate-400">
                        {rawSearch
                          ? `No ${tabLabel.toLowerCase()} matching "${rawSearch}"`
                          : `No ${tabLabel.toLowerCase()} found.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Name + avatar */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.full_name} avatarUrl={u.avatar_url} />
                        <span className="font-medium text-slate-800 truncate max-w-[160px]">
                          {u.full_name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[200px]">{u.email}</span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="py-3.5 px-4 text-slate-500 hidden md:table-cell tabular-nums text-xs">
                      {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      }).format(new Date(u.created_at || Date.now()))}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200',
                      ].join(' ')}>
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <RowActionMenu
                        user={u}
                        onEdit={(user) => setModal({ type: 'edit', user })}
                        onDelete={(user) => setModal({ type: 'delete', user })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total > PAGE_SIZE && (
          <div className="px-5 py-4 border-t border-slate-100">
            <Pagination
              meta={meta}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {modal?.type === 'create' && (
        <CreateUserModal
          role={role}
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess(`${tabLabel.slice(0, -1)} created successfully.`)}
        />
      )}
      {modal?.type === 'edit' && (
        <EditUserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess('User updated successfully.')}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => handleMutationSuccess('User deleted successfully.')}
        />
      )}

      {/* ── Toast notifications ──────────────────────────────────────── */}
      <ToastList toasts={toasts} />
    </div>
  );
}
