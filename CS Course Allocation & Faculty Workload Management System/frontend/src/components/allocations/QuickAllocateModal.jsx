import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck, 
  ShieldAlert,
  Award,
  Layers
} from 'lucide-react';

export const QuickAllocateModal = ({ course, onClose, onAssignSuccess }) => {
  if (!course) return null;

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [componentToAssign, setComponentToAssign] = useState('both'); // 'both' | 'theory' | 'lab'

  // AI-Ranked Candidates for this specific course
  const candidates = [
    {
      id: 'fac-1',
      name: 'Dr. Shafiq Ur Rehman',
      designation: 'Professor',
      type: 'Permanent',
      matchScore: 96,
      currentLoad: 6.0,
      maxLoad: 9.0,
      timesTaught: 3,
      pros: ['Taught this exact course 3 times in past cycles', 'Direct specialization match in Algorithms', '3.0 Cr available capacity'],
      cons: [],
      projectedStatus: 'Balanced (9.0 / 9.0 Cr)',
      isRecommended: true,
    },
    {
      id: 'fac-2',
      name: 'Dr. Kamran Malik',
      designation: 'Professor & HOD',
      type: 'Permanent',
      matchScore: 88,
      currentLoad: 3.0,
      maxLoad: 6.0,
      timesTaught: 2,
      pros: ['Taught 2 times previously', 'Has 3.0 Cr available capacity'],
      cons: ['High administrative commitments'],
      projectedStatus: 'Balanced (6.0 / 6.0 Cr)',
      isRecommended: true,
    },
    {
      id: 'fac-3',
      name: 'Engr. Bilal Hassan',
      designation: 'Lecturer',
      type: 'Permanent',
      matchScore: 78,
      currentLoad: 13.0,
      maxLoad: 15.0,
      timesTaught: 1,
      pros: ['Hands-on laboratory expertise', '2.0 Cr available capacity'],
      cons: ['Currently near maximum threshold'],
      projectedStatus: 'Near Maximum (15.0 / 15.0 Cr)',
      isRecommended: false,
    },
    {
      id: 'fac-4',
      name: 'Ms. Zainab Farooq',
      designation: 'Visiting Lecturer',
      type: 'Visiting',
      matchScore: 65,
      currentLoad: 6.0,
      maxLoad: 6.0,
      timesTaught: 0,
      pros: ['Industry practical experience'],
      cons: ['Visiting contract course cap reached (2/2 Courses)'],
      projectedStatus: 'Overloaded / Cap Exceeded',
      isRecommended: false,
    },
  ];

  const handleConfirmAssignment = () => {
    if (!selectedCandidate) return;
    onAssignSuccess({
      courseId: course.id,
      courseCode: course.code,
      facultyId: selectedCandidate.id,
      facultyName: selectedCandidate.name,
      component: componentToAssign,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-academic-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-academic-600 text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-academic-300">
                  AI Course Allocation Assistant
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
                Assign {course.code} — {course.title}
              </h2>
              <p className="text-xs text-academic-200">
                {course.programme} • Semester {course.semester} • {course.section} • {course.credits}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Component Selection */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Assignment Component:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'both', label: 'Full Course (Theory + Lab)' },
                { id: 'theory', label: 'Theory (3 Cr)' },
                { id: 'lab', label: 'Lab (1 Cr)' },
              ].map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setComponentToAssign(comp.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    componentToAssign === comp.id
                      ? 'bg-academic-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ranked Candidates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ranked Faculty Candidates (Match %)
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by Experience, Domain & Capacity
              </span>
            </div>

            <div className="space-y-2.5">
              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-academic-600 bg-academic-50/70 shadow-sm ring-1 ring-academic-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          idx === 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{cand.name}</h4>
                            <span className="text-xs text-slate-500 font-medium">({cand.designation})</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                            <span>Current Load: <strong>{cand.currentLoad} / {cand.maxLoad} Cr</strong></span>
                            <span>•</span>
                            <span>Taught: <strong>{cand.timesTaught} times</strong></span>
                          </div>

                          {/* Pros and warnings */}
                          <div className="mt-2 space-y-1">
                            {cand.pros.map((pro, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                <span>{pro}</span>
                              </div>
                            ))}
                            {cand.cons.map((con, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                                <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                <span>{con}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                          cand.matchScore >= 90
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : cand.matchScore >= 75
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {cand.matchScore}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedCandidate ? (
              <span>Selected: <strong className="text-slate-900">{selectedCandidate.name}</strong></span>
            ) : (
              <span>Select a candidate to proceed with allocation</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAssignment}
              disabled={!selectedCandidate}
              className="px-4 py-2 rounded-lg bg-academic-600 hover:bg-academic-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Assign & Propose</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
