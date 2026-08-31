import React from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, ShieldAlert, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export const WorkloadSummary = ({ summary = {} }) => {
  const { setActiveTab } = useApp();

  const total = summary.totalFaculty || 34;
  const underloaded = summary.underloaded ?? 2;
  const balanced = summary.balanced ?? 24;
  const nearMaximum = summary.nearMaximum ?? 6;
  const overloaded = summary.overloaded ?? 2;

  const segments = [
    {
      label: 'Balanced (Optimal)',
      count: balanced,
      percentage: Math.round((balanced / total) * 100),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      desc: 'Within recommended policy limits',
    },
    {
      label: 'Near Maximum',
      count: nearMaximum,
      percentage: Math.round((nearMaximum / total) * 100),
      color: 'bg-amber-400',
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertCircle,
      desc: '85% to 100% capacity utilization',
    },
    {
      label: 'Underloaded',
      count: underloaded,
      percentage: Math.round((underloaded / total) * 100),
      color: 'bg-blue-400',
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: AlertTriangle,
      desc: 'Below minimum required teaching quota',
    },
    {
      label: 'Overloaded',
      count: overloaded,
      percentage: Math.round((overloaded / total) * 100),
      color: 'bg-red-500',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-50 text-red-800 border-red-200',
      icon: ShieldAlert,
      desc: 'Exceeds maximum allowable policy threshold',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
            <Activity size={18} className="text-academic-600" />
            <span>Faculty Workload Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance status against departmental workload rules
          </p>
        </div>
        <button
          onClick={() => setActiveTab('faculty')}
          className="text-xs font-semibold text-academic-700 hover:text-academic-900"
        >
          View All Roster
        </button>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-5 shadow-inner">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            style={{ width: `${seg.percentage}%` }}
            className={`${seg.color} h-full transition-all duration-500`}
            title={`${seg.label}: ${seg.count} faculty (${seg.percentage}%)`}
          />
        ))}
      </div>

      {/* Breakdown Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {segments.map((seg, idx) => {
          const Icon = seg.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab('faculty')}
              className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md ${seg.badgeColor}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {seg.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {seg.desc}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{seg.count}</span>
                <span className="text-[11px] text-slate-400 ml-1">({seg.percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
