import React from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

export const ProgrammeProgress = ({ programmes = [] }) => {
  const { setActiveTab } = useApp();

  const defaultProgrammes = [
    {
      id: 'bscs',
      code: 'BSCS',
      name: 'Bachelor of Science in Computer Science',
      allocated: 38,
      total: 42,
      percentage: 90.5,
      semestersCount: 8,
      status: 'in_progress',
      color: 'bg-academic-600',
      lightColor: 'bg-academic-50 text-academic-800 border-academic-200',
    },
    {
      id: 'bsse',
      code: 'BSSE',
      name: 'Bachelor of Science in Software Engineering',
      allocated: 22,
      total: 22,
      percentage: 100,
      semestersCount: 8,
      status: 'completed',
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'mscs',
      code: 'MSCS',
      name: 'Master of Science in Computer Science',
      allocated: 8,
      total: 8,
      percentage: 100,
      semestersCount: 4,
      status: 'completed',
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
  ];

  const data = programmes.length > 0 ? programmes : defaultProgrammes;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-academic-600" />
            <span>Programme Allocation Progress</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time section component assignment rates by academic degree
          </p>
        </div>
        <button
          onClick={() => setActiveTab('allocations')}
          className="text-xs font-semibold text-academic-700 hover:text-academic-900 flex items-center gap-1"
        >
          <span>View Matrix</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {data.map((prog) => (
          <div
            key={prog.id}
            onClick={() => setActiveTab('allocations')}
            className="p-3.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  {prog.code}
                </span>
                <span className="text-xs text-slate-500 hidden md:inline truncate max-w-[200px]">
                  {prog.name}
                </span>
                <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${prog.lightColor}`}>
                  {prog.semestersCount} Semesters
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800">
                  {prog.allocated} / {prog.total} Allocated
                </span>
                {prog.percentage === 100 ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={14} /> Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                    <Clock size={14} /> {prog.total - prog.allocated} Remaining
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
              <div
                className={`${prog.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${prog.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
