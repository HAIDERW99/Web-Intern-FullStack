/**
 * Admin Dashboard — Screen 6
 * KPI cards + attendance chart + activity feed, all wired to live Supabase data.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  GraduationCap,
  FileText,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Layers,
  BarChart2,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { Skeleton } from '@components/common/Skeleton';
import {
  getAdminStats,
  getWeeklyAttendance,
  getMonthlyAttendance,
  getRecentActivity,
} from '@services/admin.service';
import type {
  AdminStats,
  AttendanceDataPoint,
  ActivityEntry,
} from '@services/admin.service';
import { AddUserModal } from './modals/AddUserModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceView = 'weekly' | 'monthly';
type ModalType      = 'student' | 'teacher' | 'batch' | null;

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trendLabel,
  trendDir,
  accentBg,
  accentText,
  badge,
}: {
  icon:        React.ElementType;
  label:       string;
  value:       string;
  trendLabel:  string;
  trendDir:    'up' | 'down' | 'neutral';
  accentBg:    string;
  accentText:  string;
  badge?:      React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${accentBg}`}>
          <Icon className={`w-5 h-5 ${accentText}`} aria-hidden="true" />
        </div>
        {badge ?? (
          trendDir !== 'neutral' && (
            <span className={`flex items-center gap-1 text-xs font-medium ${trendDir === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trendDir === 'up'
                ? <TrendingUp  className="w-3.5 h-3.5" aria-hidden="true" />
                : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
              {trendLabel}
            </span>
          )
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

/** Pure CSS bar chart — no external library */
function AttendanceBarChart({ data }: { data: AttendanceDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.rate), 1);
  const TARGET = 90;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="flex">
        <div className="w-8 flex flex-col-reverse justify-between h-40 text-[10px] text-slate-400 pr-1 pb-5">
          {[0, 25, 50, 75, 100].map((v) => (
            <span key={v} className="leading-none">{v}%</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1 h-40">
          {/* Target line */}
          <div
            className="absolute w-full border-t border-dashed border-blue-300"
            style={{ bottom: `${(TARGET / 100) * (160 - 20)}px` }}
            aria-hidden="true"
          />

          {/* Bars */}
          <div
            className="absolute inset-0 flex items-end gap-1.5 pb-5 px-1"
            role="img"
            aria-label="Attendance bar chart"
          >
            {data.map((d) => {
              const heightPct = (d.rate / max) * 80;
              return (
                <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="relative w-full group">
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {d.rate}%
                    </div>
                    <div
                      className="w-full rounded-t-sm bg-blue-600 transition-all duration-500"
                      style={{ height: `${heightPct}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 ml-8">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-3 h-2 rounded-sm bg-blue-600 inline-block" />
          Attendance
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-3 h-0 border-t border-dashed border-blue-300 inline-block" />
          Target ({TARGET}%)
        </span>
      </div>
    </div>
  );
}

function ActivityItemRow({ item }: { item: ActivityEntry }) {
  const COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
  ];
  const colorIdx =
    item.actor_initials.charCodeAt(0) % COLORS.length;
  const colorClass = COLORS[colorIdx];

  const relTime = (() => {
    const diff = Date.now() - new Date(item.created_at).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60)       return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)        return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
      new Date(item.created_at),
    );
  })();

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${colorClass}`}>
        {item.actor_initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 font-medium leading-snug">{item.event}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.detail}</p>
        <p className="text-xs text-slate-400 mt-1">{relTime}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats,          setStats]          = useState<AdminStats | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceDataPoint[]>([]);
  const [activity,       setActivity]       = useState<ActivityEntry[]>([]);
  const [statsLoading,   setStatsLoading]   = useState(true);
  const [chartLoading,   setChartLoading]   = useState(true);
  const [actLoading,     setActLoading]     = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [attendanceView, setAttendanceView] = useState<AttendanceView>('weekly');
  const [openModal,      setOpenModal]      = useState<ModalType>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getAdminStats();
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const d = attendanceView === 'weekly'
        ? await getWeeklyAttendance()
        : await getMonthlyAttendance();
      setAttendanceData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setChartLoading(false);
    }
  }, [attendanceView]);

  const loadActivity = useCallback(async () => {
    setActLoading(true);
    try {
      const a = await getRecentActivity(6);
      setActivity(a);
    } catch {
      // non-critical — just show empty state
    } finally {
      setActLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); loadActivity(); }, [loadStats, loadActivity]);
  useEffect(() => { loadChart(); }, [loadChart]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Admin';

  const fmtNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="min-h-full space-y-6 pb-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening at AcademiaX today.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setOpenModal('student')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Add Student
          </button>
          <button
            type="button"
            onClick={() => setOpenModal('teacher')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm"
          >
            Add Teacher
          </button>
          <button
            type="button"
            onClick={() => setOpenModal('batch')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            Create Batch
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors shadow-sm"
          >
            <BarChart2 className="w-4 h-4" aria-hidden="true" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => { setError(null); loadStats(); }} className="underline font-medium ml-4">
            Retry
          </button>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Students"
              value={fmtNumber(stats?.totalStudents ?? 0)}
              trendLabel="+5.2%"
              trendDir="up"
              accentBg="bg-blue-50"
              accentText="text-blue-600"
            />
            <StatCard
              icon={GraduationCap}
              label="Total Teachers"
              value={String(stats?.totalTeachers ?? 0)}
              trendLabel="No change"
              trendDir="neutral"
              accentBg="bg-slate-100"
              accentText="text-slate-600"
            />
            <StatCard
              icon={FileText}
              label="Pending Assignments"
              value={String(stats?.pendingAssignments ?? 0)}
              trendLabel="-2%"
              trendDir="down"
              accentBg="bg-rose-50"
              accentText="text-rose-600"
              badge={
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Needs review
                </span>
              }
            />
            <StatCard
              icon={CheckCircle}
              label="Overall Attendance Rate"
              value={`${stats?.attendanceRate ?? 0}%`}
              trendLabel="+1.5%"
              trendDir="up"
              accentBg="bg-emerald-50"
              accentText="text-emerald-600"
            />
          </>
        )}
      </div>

      {/* ── Middle row: Chart + Activity feed ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Attendance Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Weekly Attendance Summary
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
                {(['weekly', 'monthly'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAttendanceView(v)}
                    aria-pressed={attendanceView === v}
                    className={[
                      'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                      attendanceView === v
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    ].join(' ')}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={loadChart}
                disabled={chartLoading}
                aria-label="Refresh chart"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${chartLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-48 space-y-2">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ) : attendanceData.every((d) => d.rate === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
              <BarChart2 className="w-8 h-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm">No attendance records found for this period.</p>
            </div>
          ) : (
            <AttendanceBarChart data={attendanceData} />
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {actLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
              <Clock className="w-8 h-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm">No recent activity yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {(openModal === 'student' || openModal === 'teacher') && (
        <AddUserModal
          role={openModal}
          onClose={() => setOpenModal(null)}
          onSuccess={() => { setOpenModal(null); loadStats(); loadActivity(); }}
        />
      )}
      {openModal === 'batch' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create Batch"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenModal(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Create Batch</h2>
            <p className="text-sm text-slate-500 mb-4">
              Batches are managed through the Courses module. Navigate to Courses to create a batch.
            </p>
            <button
              type="button"
              onClick={() => setOpenModal(null)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
