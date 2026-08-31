import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  AlertOctagon, 
  FileSpreadsheet, 
  PlusCircle, 
  RefreshCw,
  SlidersHorizontal,
  Lock
} from 'lucide-react';

export const QuickActions = ({ onRefresh, isRefreshing = false }) => {
  const { setActiveTab, showToast, currentUser, currentSession } = useApp();

  return (
    <div className="bg-academic-900 rounded-xl text-white p-5 shadow-elevated relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-academic-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-academic-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles size={14} className="text-academic-400" />
            <span>HOD Operations Console</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Academic Session {currentSession?.session_code || 'FA25'} Command Centre
          </h2>
          <p className="text-xs text-academic-200 mt-1 max-w-xl">
            Audit allocations, run policy compliance scans, or manage visiting faculty requisitions.
          </p>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setActiveTab('conflicts');
              showToast('Running comprehensive conflict & compliance audit...', 'info');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <AlertOctagon size={15} />
            <span>Scan Conflicts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('allocations');
              showToast('Opening Course Allocation Matrix', 'info');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-academic-950 hover:bg-slate-100 font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <PlusCircle size={15} className="text-academic-600" />
            <span>Propose Allocation</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import-export');
              showToast('Navigating to Master Export & Timetables', 'info');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-academic-800/80 hover:bg-academic-700 text-white font-semibold text-xs border border-academic-700/60 transition-all"
          >
            <FileSpreadsheet size={15} />
            <span>Export Matrix</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-academic-800/80 hover:bg-academic-700 text-academic-200 hover:text-white border border-academic-700/60 transition-all"
              title="Refresh Dashboard Data"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
