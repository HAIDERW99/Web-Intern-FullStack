import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  History, 
  User, 
  ChevronDown, 
  BookOpen, 
  Layers, 
  Activity, 
  Scale,
  ShieldCheck,
  Info
} from 'lucide-react';

export const CourseAssignmentModal = ({ 
  allocation, 
  onClose, 
  onSaveAssignment 
}) => {
  if (!allocation) return null;

  const { currentUser, currentSession, showToast } = useApp();

  // Assignment states
  const [componentType, setComponentType] = useState('both'); // 'both' | 'theory' | 'lab'
  const [selectedFacultyId, setSelectedFacultyId] = useState(allocation.facultyId || 'fac-1');
  const [assignmentRemarks, setAssignmentRemarks] = useState(allocation.remarks || '');
  const [hodOverride, setHodOverride] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');

  // Department Roster with Workload Metrics for Real-time Calculation
  const facultyRoster = [
    {
      id: 'fac-1',
      code: 'FAC-002',
      name: 'Dr. Shafiq Ur Rehman',
      designation: 'Professor',
      type: 'Permanent',
      department: 'Computer Science',
      currentLoad: 6.0,
      maxHours: 9.0,
      minHours: 6.0,
      matchScore: 96,
      timesTaught: 3,
      eligibility: 'Theory Only',
      specialization: ['Algorithms', 'Data Structures', 'Theory of Computation'],
      pros: ['Taught this course 3 times in past cycles (FA24, SP24, FA23)', 'Core specialization match in Algorithms', '3.0 Cr remaining capacity'],
      cons: [],
    },
    {
      id: 'fac-2',
      code: 'FAC-001',
      name: 'Dr. Kamran Malik',
      designation: 'Professor & HOD',
      type: 'Permanent',
      department: 'Computer Science',
      currentLoad: 3.0,
      maxHours: 6.0,
      minHours: 3.0,
      matchScore: 88,
      timesTaught: 2,
      eligibility: 'Theory & Lab',
      specialization: ['Distributed Systems', 'Cloud Computing'],
      pros: ['Taught 2 times previously', 'Currently underloaded (3.0 Cr capacity remaining)'],
      cons: ['Department Administrative duties'],
    },
    {
      id: 'fac-3',
      code: 'FAC-004',
      name: 'Engr. Bilal Hassan',
      designation: 'Lecturer',
      type: 'Permanent',
      department: 'Computer Science',
      currentLoad: 13.0,
      maxHours: 15.0,
      minHours: 12.0,
      matchScore: 82,
      timesTaught: 2,
      eligibility: 'Theory & Lab',
      specialization: ['Data Structures', 'C++ Programming'],
      pros: ['Strong hands-on lab demonstrator', 'Taught lab component 2 times'],
      cons: ['Near maximum workload limit (13.0/15.0 Cr)'],
    },
    {
      id: 'fac-4',
      code: 'FAC-003',
      name: 'Dr. Amina Tariq',
      designation: 'Assistant Professor',
      type: 'Permanent',
      department: 'Computer Science',
      currentLoad: 12.0,
      maxHours: 12.0,
      minHours: 9.0,
      matchScore: 74,
      timesTaught: 1,
      eligibility: 'Theory & Lab',
      specialization: ['Database Systems', 'Data Science'],
      pros: ['Taught related Database structures'],
      cons: ['Currently at 100% capacity limit (12.0/12.0 Cr). Assigning will cause Overload.'],
    },
    {
      id: 'fac-5',
      code: 'VIS-001',
      name: 'Ms. Zainab Farooq',
      designation: 'Visiting Lecturer',
      type: 'Visiting',
      department: 'Computer Science',
      currentLoad: 6.0,
      maxHours: 6.0,
      minHours: 3.0,
      matchScore: 65,
      timesTaught: 0,
      eligibility: 'Theory & Lab',
      specialization: ['DevOps', 'Cloud Architecture'],
      pros: ['Industry practical experience'],
      cons: ['Visiting contract course cap reached (2/2 Courses).'],
    },
  ];

  // Selected faculty object
  const selectedFaculty = facultyRoster.find(f => f.id === selectedFacultyId) || facultyRoster[0];

  // Calculate course credits to be added based on component
  const creditsToAdd = componentType === 'lab' ? 1.0 : componentType === 'theory' ? 3.0 : 4.0;
  const weightedLoadToAdd = componentType === 'lab' ? 0.5 : componentType === 'theory' ? 3.0 : 3.5;

  // Real-time Projected Load
  const currentLoad = selectedFaculty.currentLoad;
  const projectedLoad = Number((currentLoad + weightedLoadToAdd).toFixed(1));
  const maxAllowed = selectedFaculty.maxHours;

  // Conflict Detection Logic
  const isOverload = projectedLoad > maxAllowed;
  const isLabMismatch = (componentType === 'both' || componentType === 'lab') && selectedFaculty.eligibility === 'Theory Only';
  const hasConflict = isOverload || isLabMismatch;

  const handleSave = (targetStatus) => {
    if (hasConflict && !hodOverride && currentUser.role !== 'hod') {
      showToast('Cannot proceed: Policy conflict detected. Only HOD can approve with override.', 'error');
      return;
    }

    if (hasConflict && hodOverride && !overrideJustification.trim()) {
      showToast('Please provide an override justification remark for auditing.', 'error');
      return;
    }

    onSaveAssignment({
      allocationId: allocation.id,
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.name,
      facultyDesignation: selectedFaculty.designation,
      facultyCode: selectedFaculty.code,
      componentType,
      assignedCredits: creditsToAdd,
      status: targetStatus,
      remarks: hodOverride 
        ? `[HOD OVERRIDE]: ${overrideJustification} • ${assignmentRemarks}`
        : assignmentRemarks,
      projectedLoad,
      hasConflict,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        
        {/* 1. Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-academic-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-academic-300 text-sm">
                  {allocation.courseCode}
                </span>
                <span className="text-slate-400">•</span>
                <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[280px] sm:max-w-md">
                  {allocation.courseTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {allocation.programme} • Semester {allocation.semester} • {allocation.section} • Credit Structure: <strong>{allocation.credits}</strong>
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

        {/* 2. Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Previous Allocation Intelligence Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <History size={16} className="text-academic-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Historical Allocation Intelligence:</span>
                <p className="text-slate-600 mt-0.5">
                  Last taught by <strong className="text-slate-900">{allocation.previousFaculty || 'Dr. Shafiq Ur Rehman (FA24)'}</strong> with an average student evaluation of 4.8/5.0.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-academic-100 text-academic-800 shrink-0">
              FA24 Record
            </span>
          </div>

          {/* Component Selection Pill */}
          <div className="flex items-center justify-between p-3 bg-academic-50/70 border border-academic-200 rounded-xl">
            <span className="text-xs font-bold text-academic-950">Assignment Scope:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'both', label: 'Full Course (Theory + Lab)' },
                { id: 'theory', label: 'Theory Only (3 Cr)' },
                { id: 'lab', label: 'Lab Only (1 Cr)' },
              ].map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setComponentType(comp.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    componentType === comp.id
                      ? 'bg-academic-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Recommended Candidates (Ranked Cards) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Sparkles size={14} className="text-academic-600" />
                <span>AI Recommended Faculty Candidates</span>
              </div>
              <span className="text-[11px] text-slate-400">Ranked by Domain Match, Experience & Quota</span>
            </div>

            <div className="space-y-2">
              {facultyRoster.map((fac, idx) => {
                const isSelected = selectedFacultyId === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacultyId(fac.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-academic-600 bg-academic-50/70 shadow-sm ring-1 ring-academic-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          idx === 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{fac.name}</h4>
                            <span className="text-xs text-slate-500 font-medium">({fac.designation})</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                              {fac.code}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                            <span>Current Load: <strong>{fac.currentLoad} / {fac.maxHours} Cr</strong></span>
                            <span>•</span>
                            <span>Taught: <strong>{fac.timesTaught} times</strong></span>
                            <span>•</span>
                            <span>Eligibility: <strong>{fac.eligibility}</strong></span>
                          </div>

                          {/* Reasons */}
                          <div className="mt-1.5 space-y-0.5">
                            {fac.pros.map((pro, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                <span>{pro}</span>
                              </div>
                            ))}
                            {fac.cons.map((con, i) => (
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
                          fac.matchScore >= 90
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : fac.matchScore >= 75
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {fac.matchScore}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Faculty Selection Dropdown */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Or Select Faculty Manually from Full Department Roster:
            </label>
            <div className="relative">
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                {facultyRoster.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation} • {f.code}) — Current: {f.currentLoad}/{f.maxHours} Cr
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Real-time Workload Calculation Meter */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Activity size={15} className="text-academic-600" />
                <span>Real-Time Workload Projection for {selectedFaculty.name}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isOverload ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isOverload ? 'Overload Warning' : 'Within Limits'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Current Load</span>
                <span className="text-sm font-bold text-slate-900">{currentLoad} Cr Hrs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Assignment Delta</span>
                <span className="text-sm font-bold text-academic-700">+{weightedLoadToAdd} Cr Hrs</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[11px] block">Projected Total</span>
                <span className={`text-sm font-bold ${isOverload ? 'text-red-700' : 'text-slate-900'}`}>
                  {projectedLoad} / {maxAllowed} Cr Hrs
                </span>
              </div>
            </div>

            {/* Projected Load Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (projectedLoad / maxAllowed) * 100)}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverload ? 'bg-red-500' : 'bg-academic-600'
                }`}
              />
            </div>
          </div>

          {/* 4. Smart Conflict Warning & HOD Override Box */}
          {hasConflict && (
            <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-950 text-xs">
                    Policy Violation Detected: {isOverload ? 'Workload Overload' : 'Lab Eligibility Mismatch'}
                  </h4>
                  <p className="text-xs text-red-800 mt-0.5 leading-snug">
                    {isOverload && `Assigning this course exceeds statutory maximum of ${maxAllowed} Cr Hrs (Projected: ${projectedLoad} Cr Hrs). `}
                    {isLabMismatch && `${selectedFaculty.name} has '${selectedFaculty.eligibility}' status and is not eligible for laboratory demonstrations.`}
                  </p>
                </div>
              </div>

              {/* HOD Override Checkbox */}
              {currentUser.role === 'hod' ? (
                <div className="pt-2 border-t border-red-200/80 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-red-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hodOverride}
                      onChange={(e) => setHodOverride(e.target.checked)}
                      className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span>HOD Special Authorization: Override policy rule and assign anyway</span>
                  </label>

                  {hodOverride && (
                    <input
                      type="text"
                      placeholder="Mandatory HOD override reason for audit log (e.g. Faculty specialized shortage)..."
                      value={overrideJustification}
                      onChange={(e) => setOverrideJustification(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-red-700 italic">
                  * Note: Team Members cannot override conflicts. You may save as Draft or request HOD special approval.
                </div>
              )}
            </div>
          )}

          {/* Allocation Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Allocation Remarks / Special Instructions:
            </label>
            <input
              type="text"
              placeholder="e.g. Assigned for core theory lectures; Lab handled by junior instructor..."
              value={assignmentRemarks}
              onChange={(e) => setAssignmentRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
            />
          </div>

        </div>

        {/* 5. Modal Footer with Approval Workflow Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Selected: <strong className="text-slate-900">{selectedFaculty.name}</strong> • Status will be updated
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={() => handleSave('draft')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
            >
              Save as Draft
            </button>

            <button
              onClick={() => handleSave('under_review')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
            >
              Submit for Review
            </button>

            {currentUser.role === 'hod' && (
              <button
                onClick={() => handleSave('approved')}
                className="px-4 py-2 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>HOD Approve & Lock</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
