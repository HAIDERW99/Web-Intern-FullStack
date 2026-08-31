import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  X, 
  SlidersHorizontal, 
  RefreshCw, 
  RotateCcw,
  Sparkles,
  Info,
  Check
} from 'lucide-react';

export const HODPermissionsModal = () => {
  const { 
    convenerPermissions, 
    updateConvenerPermission, 
    resetConvenerPermissions,
    showHODPermissionsModal, 
    setShowHODPermissionsModal,
    currentUser
  } = useApp();

  if (!showHODPermissionsModal) return null;

  const permissionsList = Object.values(convenerPermissions || {});
  const allowedCount = permissionsList.filter(p => p.allowed).length;
  const restrictedCount = permissionsList.length - allowedCount;

  // Group by category
  const categories = [...new Set(permissionsList.map(p => p.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-800 via-amber-700 to-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-amber-200 shadow-inner">
              <SlidersHorizontal size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  HOD Department Governance
                </span>
                <span className="text-[11px] text-amber-200">Executive Control</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-1 text-white">
                Convener Role Permissions &amp; Access Control
              </h2>
              <p className="text-xs text-amber-100/90 mt-1 max-w-md">
                Configure which features the Convener is permitted or restricted to access. Updates sync in real time.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHODPermissionsModal(false)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status & Quick Action Bar */}
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">Active Policy Summary:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
              {allowedCount} Allowed
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold">
              {restrictedCount} Restricted
            </span>
          </div>

          <button
            onClick={resetConvenerPermissions}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-all self-start sm:self-auto"
            title="Reset to department standard policy"
          >
            <RotateCcw size={12} />
            <span>Reset to Standard Policy</span>
          </button>
        </div>

        {/* Permission Categories & Toggles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[55vh]">
          {categories.map((category) => {
            const categoryPerms = permissionsList.filter(p => p.category === category);
            return (
              <div key={category} className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>{category}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {categoryPerms.map((perm) => (
                    <div
                      key={perm.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        perm.allowed
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {perm.name}
                          </span>
                          {perm.allowed ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                              Allowed
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                              HOD Only
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal max-w-lg">
                          {perm.description}
                        </p>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => updateConvenerPermission(perm.id, !perm.allowed)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          perm.allowed ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        role="switch"
                        aria-checked={perm.allowed}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            perm.allowed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Toggles take effect immediately across all Convener views and popup guidance.
          </p>
          <button
            onClick={() => setShowHODPermissionsModal(false)}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
