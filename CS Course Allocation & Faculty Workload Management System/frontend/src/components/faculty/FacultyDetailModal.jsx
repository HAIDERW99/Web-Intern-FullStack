import React from 'react';
import { 
  X, 
  User, 
  BookOpen, 
  Calendar, 
  Activity, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export const FacultyDetailModal = ({ faculty, onClose }) => {
  if (!faculty) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-academic-600 flex items-center justify-center font-bold text-sm text-white">
              {faculty.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{faculty.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-academic-300 border border-slate-700">
                  {faculty.code}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {faculty.designation} • {faculty.dedicatedProgramme || 'Department of CS'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Employment</span>
              <div className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                {faculty.employmentType === 'full_time' ? 'Permanent' : 'Visiting'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Theory Load</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {faculty.theoryHours || 0} Cr Hrs
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Lab Load</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {faculty.labHours || 0} Cr Hrs
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Load / Max</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span>{faculty.totalLoad || faculty.allocatedHours} / {faculty.maxHours} Cr</span>
              </div>
            </div>
          </div>

          {/* Specialization & Eligibility */}
          <div className="p-4 rounded-xl bg-academic-50/70 border border-academic-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-academic-900">
              <span className="flex items-center gap-1.5">
                <Award size={14} className="text-academic-600" />
                <span>Specialization & Core Competencies</span>
              </span>
              <span className="text-[11px] text-academic-700">
                Eligible for: <strong>{faculty.eligibility || 'Theory & Lab'}</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(faculty.specialization || ['Algorithms', 'Data Structures', 'Distributed Systems']).map((spec, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-white text-academic-800 border border-academic-200 shadow-2xs">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Current Semester Allocations Breakdown */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-academic-600" />
              <span>Current Session (FA25) Course Allocations</span>
            </h3>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Course Code & Title</th>
                    <th className="py-2.5 px-3">Programme & Section</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Credit Hours</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(faculty.allocationsList || [
                    {
                      code: 'CS-201',
                      title: 'Data Structures & Algorithms',
                      programme: 'BSCS',
                      section: 'BSCS-3A',
                      component: 'Theory',
                      credits: '3.0 Cr',
                      status: 'Approved',
                    },
                    {
                      code: 'CS-201',
                      title: 'Data Structures Lab',
                      programme: 'BSCS',
                      section: 'BSCS-3B',
                      component: 'Lab',
                      credits: '1.0 Cr (3 Contact)',
                      status: 'Approved',
                    }
                  ]).map((alloc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{alloc.code}</div>
                        <div className="text-[11px] text-slate-500">{alloc.title}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{alloc.programme}</span>
                        <div className="text-[11px] text-slate-500">{alloc.section}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                          {alloc.component}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{alloc.credits}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {alloc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Teaching Track Record */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-academic-600" />
              <span>Historical Teaching Experience</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Courses previously instructed across past 4 academic cycles (used by AI Recommendation scoring).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">CS-201 Data Structures</span>
                  <div className="text-[11px] text-slate-500">Taught in FA24, SP24, FA23</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-100 text-academic-800">
                  3 Cycles
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">CS-302 Design & Analysis of Algo</span>
                  <div className="text-[11px] text-slate-500">Taught in SP24, SP23</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-100 text-academic-800">
                  2 Cycles
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Workload Status: <strong className="text-slate-800">{faculty.status}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
