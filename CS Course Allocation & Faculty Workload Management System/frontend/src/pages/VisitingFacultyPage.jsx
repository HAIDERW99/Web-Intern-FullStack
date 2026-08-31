import React from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, Plus, Calendar, DollarSign, Building, Award } from 'lucide-react';

export const VisitingFacultyPage = () => {
  const { showToast } = useApp();

  const visitingList = [
    {
      id: '1',
      name: 'Ms. Zainab Farooq',
      institution: 'TechCorp Global Solutions',
      degree: 'MS Software Engineering',
      rate: 'PKR 3,500 / hr',
      maxCourses: 2,
      assignedCourses: 2,
      contractStart: '2025-09-01',
      contractEnd: '2026-01-31',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Engr. Haris Mehmood',
      institution: 'Systems Limited',
      degree: 'MS Data Science',
      rate: 'PKR 3,500 / hr',
      maxCourses: 2,
      assignedCourses: 1,
      contractStart: '2025-09-01',
      contractEnd: '2026-01-31',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase size={24} className="text-academic-600" />
            <span>Visiting Faculty Roster & Contracts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Industry specialist contracts, remuneration rates, and course caps
          </p>
        </div>

        <button
          onClick={() => showToast('Opening Visiting Contract Requisition', 'info')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-academic-600 hover:bg-academic-700 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>New Visiting Contract</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visitingList.map((item) => (
          <div key={item.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Building size={13} className="text-academic-600" />
                  <span>{item.institution}</span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Highest Degree:</span>
                <div className="font-medium text-slate-800">{item.degree}</div>
              </div>
              <div>
                <span className="text-slate-400">Remuneration Rate:</span>
                <div className="font-medium text-slate-800">{item.rate}</div>
              </div>
              <div>
                <span className="text-slate-400">Course Load Cap:</span>
                <div className="font-bold text-slate-900">{item.assignedCourses} / {item.maxCourses} Courses</div>
              </div>
              <div>
                <span className="text-slate-400">Contract Window:</span>
                <div className="font-medium text-slate-700 text-[11px]">{item.contractStart} to {item.contractEnd}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

