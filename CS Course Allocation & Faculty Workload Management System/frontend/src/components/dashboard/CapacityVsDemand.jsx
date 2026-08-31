import React from 'react';
import { useApp } from '../../context/AppContext';
import { Scale, Users, Briefcase, TrendingUp, Info } from 'lucide-react';

export const CapacityVsDemand = ({ metrics = {} }) => {
  const { setActiveTab } = useApp();

  const totalDemandCredits = metrics.totalDemandCredits || 248.0;
  const permanentCapacityCredits = metrics.permanentCapacityCredits || 210.0;
  const visitingRequirementCredits = Math.max(0, totalDemandCredits - permanentCapacityCredits);
  const visitingHeadcountEstimate = Math.ceil(visitingRequirementCredits / 6.0); // Assuming 6 credits average visiting load

  const permanentShare = Math.round((permanentCapacityCredits / totalDemandCredits) * 100);
  const visitingShare = 100 - permanentShare;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
            <Scale size={18} className="text-academic-600" />
            <span>Faculty Capacity vs Teaching Demand</span>
          </h3>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            Fall 2025 Quota
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Permanent faculty teaching capacity versus projected visiting instructor deficit.
        </p>

        {/* Visual Dual Distribution Bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-academic-800">
              <span className="w-2.5 h-2.5 rounded-full bg-academic-600" />
              Permanent Coverage ({permanentShare}%)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-800">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Visiting Deficit ({visitingShare}%)
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${permanentShare}%` }}
              className="bg-academic-600 h-full rounded-l-full transition-all duration-500"
              title={`Permanent Capacity: ${permanentCapacityCredits} Credits`}
            />
            <div
              style={{ width: `${visitingShare}%` }}
              className="bg-indigo-500 h-full rounded-r-full transition-all duration-500"
              title={`Visiting Requirement: ${visitingRequirementCredits} Credits`}
            />
          </div>
        </div>

        {/* Breakdown Stat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-academic-50/70 border border-academic-100">
            <div className="flex items-center gap-2 text-academic-800 text-xs font-semibold">
              <Users size={14} />
              <span>Permanent Capacity</span>
            </div>
            <div className="text-lg font-bold text-academic-950 mt-1">
              {permanentCapacityCredits} <span className="text-xs font-normal text-academic-700">Cr Hrs</span>
            </div>
            <div className="text-[11px] text-academic-700 mt-0.5">
              Across 26 full-time faculty
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-800 text-xs font-semibold">
              <Briefcase size={14} />
              <span>Visiting Demand</span>
            </div>
            <div className="text-lg font-bold text-indigo-950 mt-1">
              {visitingRequirementCredits} <span className="text-xs font-normal text-indigo-700">Cr Hrs</span>
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5">
              ~{visitingHeadcountEstimate} Visiting slots required
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Advice Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info size={13} className="text-academic-600 shrink-0" />
          <span>Total Semester Load: <strong>{totalDemandCredits} Cr Hrs</strong></span>
        </div>
        <button
          onClick={() => setActiveTab('visiting')}
          className="text-xs font-semibold text-academic-700 hover:text-academic-900 underline"
        >
          Manage Visiting Roster
        </button>
      </div>
    </div>
  );
};
