import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Filter,
  Info,
  X,
  ChevronRight,
  Users,
  BookOpen,
  Clock,
  Layers,
  Activity,
  RotateCcw
} from 'lucide-react';

const CONFLICT_TYPES = ['all', 'workload_overflow', 'lab_mismatch', 'unallocated_course', 'duplicate'];
const SEVERITIES     = ['all', 'critical', 'warning', 'info'];

export const ConflictCentrePage = () => {
  const { 
    currentSession, 
    currentUser, 
    showToast, 
    setActiveTab, 
    allocations = [],
    conflicts = [],
    setConflicts,
    resolveConflict,
  } = useApp();

  const [isScanning, setIsScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('unresolved');
  const [expandedId, setExpandedId] = useState(null);

  // Derived counts for summary
  const criticalCount = conflicts.filter(c => c.severity === 'critical' && c.status !== 'resolved').length;
  const warningCount  = conflicts.filter(c => c.severity === 'warning'  && c.status !== 'resolved').length;
  const infoCount     = conflicts.filter(c => c.severity === 'info'     && c.status !== 'resolved').length;
  const resolvedCount = conflicts.filter(c => c.status === 'resolved').length;
  const totalActive   = conflicts.filter(c => c.status !== 'resolved').length;
  const healthPct     = conflicts.length > 0 
    ? Math.round(((conflicts.length - criticalCount) / conflicts.length) * 100) 
    : 100;

  // Filtered list
  const filtered = useMemo(() => {
    return conflicts.filter(c => {
      if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
      if (filterType     !== 'all' && c.type     !== filterType)     return false;
      if (filterStatus   !== 'all' && c.status   !== filterStatus)   return false;
      return true;
    });
  }, [conflicts, filterSeverity, filterType, filterStatus]);

  const handleResolve = (id, note) => {
    resolveConflict(id, note || 'Resolved by HOD in Conflict Centre');
    setExpandedId(null);
    showToast('Conflict marked as resolved. Audit record saved permanently.', 'success');
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      showToast(`Session ${currentSession.session_code} compliance audit refreshed — ${totalActive} active issue(s).`, 'info');
    }, 800);
  };

  const handleResetAudit = () => {
    localStorage.removeItem('cs_conflicts_matrix');
    window.location.reload();
  };

  const severityMeta = {
    critical: { bg: 'bg-red-50',    border: 'border-red-200',    icon: <AlertOctagon  size={20} />, iconClass: 'text-red-600',  badge: 'bg-red-100 text-red-800',   label: 'Critical' },
    warning:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: <AlertTriangle size={20} />, iconClass: 'text-amber-600',badge: 'bg-amber-100 text-amber-800', label: 'Warning'  },
    info:     { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: <Info          size={20} />, iconClass: 'text-blue-500', badge: 'bg-blue-100 text-blue-800',   label: 'Info'     },
  };

  const typeLabelMap = {
    workload_overflow:  'Workload Overload',
    lab_mismatch:       'Lab Eligibility',
    unallocated_course: 'Unallocated Course',
    duplicate:          'Duplicate Booking',
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Page Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertOctagon size={24} className="text-red-600" />
            <span>Policy Conflict &amp; Compliance Centre</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated audit of all scheduling conflicts, overloads, and policy violations for&nbsp;
            <strong>{currentSession.session_code}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAudit}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
            title="Reset audit conflicts to defaults"
          >
            <RotateCcw size={13} className="text-slate-500" />
            <span>Reset Audit Data</span>
          </button>

          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-70"
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Auditing Allocations...' : 'Run Compliance Scan'}</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Critical</span>
            <AlertOctagon size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-950 mt-1 tabular-nums">{criticalCount}</div>
          <p className="text-[11px] text-red-700 mt-0.5">Must resolve before HOD sign-off</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Warnings</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1 tabular-nums">{warningCount}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Action recommended</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Advisory</span>
            <Info size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1 tabular-nums">{infoCount}</div>
          <p className="text-[11px] text-blue-700 mt-0.5">Monitor situations</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Health Score</span>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">{healthPct}%</div>
          <p className="text-[11px] text-emerald-700 mt-0.5">{resolvedCount} resolved of {conflicts.length}</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-subtle">
        <Filter size={14} className="text-slate-400 mr-1" />

        {/* Severity */}
        {SEVERITIES.map(s => (
          <button
            key={s}
            onClick={() => setFilterSeverity(s)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
              filterSeverity === s
                ? 'bg-academic-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All Severities' : s}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
        >
          <option value="all">All Types</option>
          {Object.entries(typeLabelMap).map(([k,v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
        >
          <option value="all">All Statuses</option>
          <option value="unresolved">Unresolved Only</option>
          <option value="resolved">Resolved Only</option>
        </select>

        <span className="ml-auto text-[11px] font-semibold text-slate-500">
          {filtered.length} issue(s) shown
        </span>
      </div>

      {/* ── Conflict Cards ───────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-2" />
            <h3 className="text-base font-bold text-slate-900">No conflicts match current filters.</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust the filters above or run a fresh compliance scan.</p>
          </div>
        )}

        {filtered.map(item => {
          const meta = severityMeta[item.severity];
          const isExpanded = expandedId === item.id;
          const isResolved = item.status === 'resolved';

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all ${
                isResolved ? 'bg-slate-50 border-slate-200 opacity-60' : `${meta.bg} ${meta.border}`
              }`}
            >
              {/* Card Header Row */}
              <div
                className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className={`p-2 rounded-lg shrink-0 ${meta.iconClass} bg-white/70`}>
                  {meta.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/80 text-slate-600 border border-slate-200">
                      {typeLabelMap[item.type]}
                    </span>
                    {isResolved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Resolved
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 mt-1 leading-snug">{item.message}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      <span>{item.faculty}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} />
                      <span>{item.course}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      <span>{item.programme} • Semester {item.semester}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:self-start">
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-current/10 p-4 space-y-4 bg-white/50 rounded-b-xl">
                  {/* Detail Text */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Technical Detail
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.detail}</p>
                  </div>

                  {/* Recommended Resolution */}
                  <div className="p-3 rounded-lg bg-academic-50 border border-academic-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-academic-700 block mb-1">
                      Recommended Resolution
                    </span>
                    <p className="text-xs text-academic-950 leading-snug">{item.recommendedAction}</p>
                  </div>

                  {/* Action Buttons */}
                  {!isResolved && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Navigate to Resolution Screen */}
                      <button
                        onClick={() => {
                          setActiveTab(item.redirectTab);
                          showToast(`Navigating to ${item.resolveAction}`, 'info');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-academic-600 hover:bg-academic-700 text-white font-semibold text-xs shadow-xs transition-all"
                      >
                        <ArrowRight size={13} />
                        <span>{item.resolveAction}</span>
                      </button>

                      {/* HOD direct resolve mark */}
                      {(currentUser.role === 'hod') && (
                        <button
                          onClick={() => handleResolve(item.id, 'HOD manual override resolution')}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
                        >
                          <CheckCircle2 size={13} />
                          <span>HOD: Mark as Resolved</span>
                        </button>
                      )}

                      {currentUser.role !== 'hod' && (
                        <button
                          onClick={() => handleResolve(item.id, 'Team member acknowledged')}
                          className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
                        >
                          Acknowledge &amp; Flag for HOD
                        </button>
                      )}
                    </div>
                  )}

                  {isResolved && item.resolvedNote && (
                    <div className="text-[11px] text-slate-500 italic">
                      Resolved Note: {item.resolvedNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

