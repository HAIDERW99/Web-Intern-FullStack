import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  X, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Users, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

export const ConvenerPermissionsModal = () => {
  const { 
    convenerPermissions, 
    showConvenerPermissionsModal, 
    setShowConvenerPermissionsModal,
    currentUser 
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'allowed' | 'restricted'

  if (!showConvenerPermissionsModal) return null;

  const permissionsList = Object.values(convenerPermissions || {});
  const allowedList = permissionsList.filter(p => p.allowed);
  const restrictedList = permissionsList.filter(p => !p.allowed);

  const displayedList = activeFilter === 'allowed' 
    ? allowedList 
    : activeFilter === 'restricted' 
    ? restrictedList 
    : permissionsList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
        
        {/* Modal Header Banner */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-indigo-400/20 text-indigo-200 border border-indigo-300/30">
                  Role Authority Policy
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-1 text-white">
                Convener Portal Privileges &amp; Scope
              </h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-md">
                Assigned to: <strong className="text-white">{currentUser?.name || 'Convener'}</strong> ({currentUser?.designation || 'BSCS Convener'})
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConvenerPermissionsModal(false)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors relative z-10"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {/* HOD Policy Notification Ribbon */}
        <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-indigo-600 shrink-0" />
            <span>
              Configured by <strong>Head of Department (Dr. Kamran Malik)</strong>. Real-time updates reflect instantly.
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-[11px]">
            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              {allowedList.length} Allowed
            </span>
            <span className="text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
              {restrictedList.length} HOD Restricted
            </span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Features ({permissionsList.length})
            </button>
            <button
              onClick={() => setActiveFilter('allowed')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'allowed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Allowed ({allowedList.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('restricted')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeFilter === 'restricted'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock size={12} />
              <span>Restricted ({restrictedList.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Showing {displayedList.length} items
          </span>
        </div>

        {/* Permissions Cards Grid List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[50vh]">
          {displayedList.map((perm) => (
            <div
              key={perm.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                perm.allowed
                  ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  perm.allowed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {perm.allowed ? <CheckCircle2 size={18} /> : <Lock size={16} />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      {perm.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                      {perm.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {perm.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {perm.allowed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 size={11} />
                    <span>ALLOWED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                    <Lock size={11} />
                    <span>HOD ONLY</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-600" />
            <span>You can review this policy anytime from the top navigation bar.</span>
          </div>

          <button
            onClick={() => setShowConvenerPermissionsModal(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Proceed to Convener Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
