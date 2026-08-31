import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  User,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Trash2,
  Plus,
  Lock,
  RefreshCw
} from 'lucide-react';

const ACTION_TYPES = ['all', 'Assigned', 'Updated', 'Approved', 'Rejected', 'Submitted', 'Override', 'Deleted'];

const DEMO_LOGS = [
  {
    id: 'log-1',
    user: 'Dr. Kamran Malik',
    userRole: 'HOD',
    userCode: 'FAC-001',
    action: 'Approved',
    actionDescription: 'HOD Approved and locked allocation',
    date: '2026-08-29',
    time: '09:45:12',
    programme: 'BSCS',
    semester: 3,
    course: 'CS-201 Data Structures & Algorithms',
    previousValue: 'Status: Under Review',
    newValue: 'Status: Approved (Locked)',
    severity: 'success',
  },
  {
    id: 'log-2',
    user: 'Ms. Ayesha Noor',
    userRole: 'Convener',
    userCode: 'USR-004',
    action: 'Assigned',
    actionDescription: 'Faculty assigned to course offering',
    date: '2026-08-29',
    time: '09:32:05',
    programme: 'BSCS',
    semester: 3,
    course: 'CS-201 Data Structures & Algorithms',
    previousValue: 'Faculty: Unassigned',
    newValue: 'Faculty: Dr. Shafiq Ur Rehman (FAC-002)',
    severity: 'info',
  },
  {
    id: 'log-3',
    user: 'Ms. Ayesha Noor',
    userRole: 'Convener',
    userCode: 'USR-004',
    action: 'Submitted',
    actionDescription: 'Submitted allocation for HOD review',
    date: '2026-08-29',
    time: '09:41:33',
    programme: 'BSCS',
    semester: 3,
    course: 'CS-201 Data Structures & Algorithms',
    previousValue: 'Status: Draft',
    newValue: 'Status: Under Review',
    severity: 'info',
  },
  {
    id: 'log-4',
    user: 'Dr. Kamran Malik',
    userRole: 'HOD',
    userCode: 'FAC-001',
    action: 'Override',
    actionDescription: 'HOD policy override — Approved despite eligibility warning',
    date: '2026-08-29',
    time: '10:02:47',
    programme: 'BSCS',
    semester: 5,
    course: 'CS-305 Artificial Intelligence',
    previousValue: 'Conflict: Lab Eligibility Mismatch (Theory Only faculty)',
    newValue: 'Override Reason: Specialist shortage — visiting contract being processed',
    severity: 'warning',
  },
  {
    id: 'log-5',
    user: 'Ms. Ayesha Noor',
    userRole: 'Convener',
    userCode: 'USR-004',
    action: 'Updated',
    actionDescription: 'Assignment component changed from Full to Theory Only',
    date: '2026-08-28',
    time: '16:15:22',
    programme: 'BSCS',
    semester: 3,
    course: 'CS-202 Database Systems',
    previousValue: 'Component: Full (Theory + Lab), Faculty: Dr. Amina Tariq',
    newValue: 'Component: Theory Only, Lab section split to separate allocation',
    severity: 'info',
  },
  {
    id: 'log-6',
    user: 'Dr. Kamran Malik',
    userRole: 'HOD',
    userCode: 'FAC-001',
    action: 'Approved',
    actionDescription: 'HOD batch-approved 3 allocations',
    date: '2026-08-28',
    time: '17:00:05',
    programme: 'BSSE',
    semester: 3,
    course: 'SE-302 Software Requirements Engineering',
    previousValue: 'Status: Under Review',
    newValue: 'Status: Approved (Locked)',
    severity: 'success',
  },
  {
    id: 'log-7',
    user: 'Mr. Tariq Bashir',
    userRole: 'Convener',
    userCode: 'USR-005',
    action: 'Deleted',
    actionDescription: 'Removed duplicate draft allocation',
    date: '2026-08-27',
    time: '11:30:18',
    programme: 'MSCS',
    semester: 1,
    course: 'CS-701 Advanced Analysis of Algorithms',
    previousValue: 'Duplicate Draft — Faculty: Ms. Zainab Farooq (Visiting)',
    newValue: 'Deleted. Correct assignment retained: Dr. Shafiq Ur Rehman',
    severity: 'critical',
  },
  {
    id: 'log-8',
    user: 'System',
    userRole: 'System',
    userCode: 'SYS',
    action: 'Assigned',
    actionDescription: 'Auto-conflict detected and flagged on session scan',
    date: '2026-08-29',
    time: '08:32:00',
    programme: 'BSCS',
    semester: 3,
    course: 'CS-202 Database Systems',
    previousValue: 'Workload: 11.5 Cr (Within Limit)',
    newValue: 'Workload: 15.0 Cr — OVERLOADED (Limit: 12.0 Cr). Conflict #conf-1 auto-created.',
    severity: 'warning',
  },
];

export const ActivityLogPage = () => {
  const { currentSession } = useApp();

  const [searchTerm, setSearchTerm]           = useState('');
  const [filterAction, setFilterAction]       = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterUser, setFilterUser]           = useState('ALL');
  const [sortField, setSortField]             = useState('date');
  const [sortOrder, setSortOrder]             = useState('desc');

  const uniqueUsers = ['ALL', ...Array.from(new Set(DEMO_LOGS.map(l => l.user)))];

  const filtered = useMemo(() => {
    return DEMO_LOGS
      .filter(l => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          l.user.toLowerCase().includes(search) ||
          l.course.toLowerCase().includes(search) ||
          l.actionDescription.toLowerCase().includes(search) ||
          l.newValue.toLowerCase().includes(search) ||
          l.previousValue.toLowerCase().includes(search);

        if (!matchesSearch) return false;
        if (filterAction !== 'all' && l.action !== filterAction) return false;
        if (filterProgramme !== 'ALL' && l.programme !== filterProgramme) return false;
        if (filterUser !== 'ALL' && l.user !== filterUser) return false;
        return true;
      })
      .sort((a, b) => {
        const tsA = `${a.date}T${a.time}`;
        const tsB = `${b.date}T${b.time}`;
        return sortOrder === 'desc' ? tsB.localeCompare(tsA) : tsA.localeCompare(tsB);
      });
  }, [searchTerm, filterAction, filterProgramme, filterUser, sortOrder]);

  const severityMeta = {
    success:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    warning:  { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-800 border-amber-200'       },
    critical: { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-800 border-red-200'             },
    info:     { dot: 'bg-academic-500',badge: 'bg-academic-50 text-academic-800 border-academic-200' },
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-400 opacity-60 ml-1 inline" />;
    return sortOrder === 'asc'
      ? <ArrowUp size={12} className="text-academic-600 ml-1 inline" />
      : <ArrowDown size={12} className="text-academic-600 ml-1 inline" />;
  };

  const actionIcon = {
    Approved:  <ShieldCheck size={12} className="text-emerald-600" />,
    Submitted: <RefreshCw  size={12} className="text-amber-500" />,
    Assigned:  <Plus       size={12} className="text-academic-600" />,
    Updated:   <Edit3      size={12} className="text-slate-500" />,
    Deleted:   <Trash2     size={12} className="text-red-600" />,
    Override:  <AlertTriangle size={12} className="text-orange-600" />,
    Rejected:  <AlertTriangle size={12} className="text-red-600" />,
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity size={24} className="text-academic-600" />
            <span>Activity Log &amp; Audit History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable record of all changes made in session&nbsp;
            <strong>{currentSession.session_code}</strong> — Who, What, When, Before, and After.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-academic-50 border border-academic-200 text-academic-900 font-bold text-xs shrink-0">
          {DEMO_LOGS.length} Total Events
        </span>
      </div>

      {/* ── Filters ─────────────────────────── */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-start md:items-center gap-3 flex-wrap">
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user, course, action, values..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
        >
          {ACTION_TYPES.map(a => (
            <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>
          ))}
        </select>

        <select
          value={filterProgramme}
          onChange={e => setFilterProgramme(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
        >
          <option value="ALL">All Programmes</option>
          <option value="BSCS">BSCS</option>
          <option value="BSSE">BSSE</option>
          <option value="MSCS">MSCS</option>
        </select>

        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
        >
          {uniqueUsers.map(u => (
            <option key={u} value={u}>{u === 'ALL' ? 'All Users' : u}</option>
          ))}
        </select>

        {/* Sort Direction Toggle */}
        <button
          onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
        >
          {sortOrder === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
          <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
        </button>

        <span className="ml-auto text-[11px] text-slate-400 font-medium">
          {filtered.length} event(s)
        </span>
      </div>

      {/* ── Desktop Table ─────────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-40">Date &amp; Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Programme / Semester</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Previous Value</th>
                <th className="py-3 px-4">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(log => {
                const meta = severityMeta[log.severity] || severityMeta.info;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                        <div>
                          <div className="font-semibold text-slate-800 font-mono">{log.date}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.time}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.user}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400">{log.userCode}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                          {log.userRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                        {actionIcon[log.action]}
                        <span>{log.action}</span>
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug max-w-[140px]">
                        {log.actionDescription}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{log.programme}</span>
                      <div className="text-[11px] text-slate-400">Sem {log.semester}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 max-w-[160px]">
                      {log.course}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[180px] leading-snug">
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700 inline-block">
                        {log.previousValue}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] max-w-[180px] leading-snug">
                      <span className={`font-mono px-1 py-0.5 rounded inline-block ${
                        log.severity === 'success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : log.severity === 'critical' || log.severity === 'warning'
                          ? 'bg-red-50 text-red-800'
                          : 'bg-academic-50 text-academic-800'
                      }`}>
                        {log.newValue}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Stacked Cards ─────────── */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map(log => {
          const meta = severityMeta[log.severity] || severityMeta.info;
          return (
            <div key={log.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${meta.dot}`} />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{log.user}</div>
                    <div className="text-[11px] text-slate-400">{log.userRole} • {log.date} {log.time}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                  {log.action}
                </span>
              </div>

              <p className="text-xs text-slate-700">{log.actionDescription}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Programme:</span>
                  <div className="font-semibold text-slate-800">{log.programme} • Sem {log.semester}</div>
                </div>
                <div>
                  <span className="text-slate-400">Course:</span>
                  <div className="font-semibold text-slate-800">{log.course}</div>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div>
                  <span className="text-slate-400">Before: </span>
                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{log.previousValue}</span>
                </div>
                <div>
                  <span className="text-slate-400">After: </span>
                  <span className="font-mono bg-academic-50 px-1 py-0.5 rounded text-academic-800">{log.newValue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

