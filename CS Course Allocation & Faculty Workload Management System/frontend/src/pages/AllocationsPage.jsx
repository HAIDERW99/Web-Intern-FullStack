import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CourseAssignmentModal } from '../components/allocations/CourseAssignmentModal';
import { 
  Layers, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  UserPlus, 
  UserCheck, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Activity,
  History,
  FileCheck2
} from 'lucide-react';

export const AllocationsPage = () => {
  const { currentSession, currentUser, showToast, allocations, setAllocations, updateAllocation } = useApp();

  // Search, Filters & Sorting States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [sortField, setSortField] = useState('courseCode');
  const [sortOrder, setSortOrder] = useState('asc');

  // Selected row for Assignment Modal
  const [activeAllocationForModal, setActiveAllocationForModal] = useState(null);

  // Batch Selection Checkbox State
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filtering & Sorting
  const filteredAndSortedAllocations = useMemo(() => {
    return allocations
      .filter((a) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          a.courseCode.toLowerCase().includes(search) ||
          a.courseTitle.toLowerCase().includes(search) ||
          a.facultyAssigned.toLowerCase().includes(search) ||
          a.previousFaculty.toLowerCase().includes(search);

        if (!matchesSearch) return false;

        if (filterProgramme !== 'ALL' && a.programme !== filterProgramme) return false;
        if (filterSemester !== 'ALL' && String(a.semester) !== filterSemester) return false;
        if (filterSection !== 'ALL' && a.section !== filterSection) return false;
        if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [allocations, searchTerm, filterProgramme, filterSemester, filterSection, filterStatus, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} className="text-academic-600 font-bold ml-1 inline" />
    ) : (
      <ArrowDown size={13} className="text-academic-600 font-bold ml-1 inline" />
    );
  };

  // Batch Select Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedAllocations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedAllocations.map(a => a.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk Workflow Actions
  const handleBulkSubmit = () => {
    if (selectedIds.size === 0) return;
    setAllocations(prev => prev.map(a => selectedIds.has(a.id) && a.status === 'draft' ? { ...a, status: 'under_review' } : a));
    showToast(`Submitted ${selectedIds.size} allocation(s) for HOD review.`, 'success');
    setSelectedIds(new Set());
  };

  const handleBulkApprove = () => {
    if (currentUser.role !== 'hod') {
      showToast('Only the Head of Department (HOD) has approval authority.', 'error');
      return;
    }
    if (selectedIds.size === 0) return;
    setAllocations(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status: 'approved', approvedBy: currentUser.name } : a));
    showToast(`HOD successfully approved and locked ${selectedIds.size} allocation(s).`, 'success');
    setSelectedIds(new Set());
  };

  // Save Assignment from Modal
  const handleSaveAssignment = (result) => {
    updateAllocation({
      id: result.allocationId,
      facultyId: result.facultyId,
      facultyAssigned: result.facultyName,
      facultyDesignation: result.facultyDesignation,
      facultyCode: result.facultyCode,
      status: result.status,
      remarks: result.remarks,
      workloadImpact: `+${result.assignedCredits} Cr (${result.projectedLoad} Cr total)`,
      workloadStatus: result.hasConflict ? 'warning' : 'optimal',
      approvedBy: result.status === 'approved' ? currentUser.name : null,
    });

    setActiveAllocationForModal(null);
    showToast(
      `Updated allocation for ${result.facultyName} (Status: ${result.status.toUpperCase()})`,
      result.status === 'approved' ? 'success' : 'info'
    );
  };

  // Summary Metrics
  const totalSlots = allocations.length;
  const approvedCount = allocations.filter(a => a.status === 'approved').length;
  const reviewCount = allocations.filter(a => a.status === 'under_review').length;
  const draftCount = allocations.filter(a => a.status === 'draft').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers size={24} className="text-academic-600" />
            <span>Interactive Allocation Workspace</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section-by-section course assignment matrix, previous intelligence, and approval pipeline for {currentSession.name}
          </p>
        </div>

        {/* Top Status Counters */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
            {approvedCount} Approved & Locked
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-bold border border-amber-200">
            {reviewCount} Under Review
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {draftCount} Drafts
          </span>
        </div>
      </div>

      {/* 2. Batch Operations Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Course, Faculty, Section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Programmes</option>
            <option value="BSCS">BSCS</option>
            <option value="BSSE">BSSE</option>
            <option value="MSCS">MSCS</option>
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Sem 1</option>
            <option value="3">Sem 3</option>
            <option value="5">Sem 5</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Approved & Locked</option>
            <option value="under_review">Under Review</option>
            <option value="draft">Draft</option>
          </select>

          {/* Batch Action Buttons */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={handleBulkSubmit}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
              >
                Submit ({selectedIds.size}) for Review
              </button>

              {currentUser.role === 'hod' && (
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                >
                  <ShieldCheck size={13} />
                  <span>HOD Approve ({selectedIds.size})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Master Allocation Matrix Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                    {selectedIds.size === filteredAndSortedAllocations.length && selectedIds.size > 0 ? (
                      <CheckSquare size={16} className="text-academic-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th onClick={() => handleSort('courseCode')} className="py-3 px-3 cursor-pointer hover:bg-slate-100">
                  Course & Title {renderSortIndicator('courseCode')}
                </th>
                <th onClick={() => handleSort('programme')} className="py-3 px-3 cursor-pointer hover:bg-slate-100">
                  Prog / Sem {renderSortIndicator('programme')}
                </th>
                <th className="py-3 px-3">Section</th>
                <th className="py-3 px-3 font-mono">Credit</th>
                <th className="py-3 px-3 text-center">Theory</th>
                <th className="py-3 px-3 text-center">Lab</th>
                <th onClick={() => handleSort('facultyAssigned')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                  Faculty Assigned {renderSortIndicator('facultyAssigned')}
                </th>
                <th className="py-3 px-3">Previous Faculty</th>
                <th className="py-3 px-3">Workload Impact</th>
                <th onClick={() => handleSort('status')} className="py-3 px-3 cursor-pointer hover:bg-slate-100">
                  Status & Lock {renderSortIndicator('status')}
                </th>
                <th className="py-3 px-3 text-right">Assign Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedAllocations.map((row) => {
                const isSelected = selectedIds.has(row.id);
                const isLockedForUser = row.status === 'approved' && currentUser.role !== 'hod';

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-academic-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => toggleSelectRow(row.id)} className="text-slate-400 hover:text-slate-700">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-academic-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{row.courseCode}</div>
                      <div className="text-slate-500 font-medium truncate max-w-[170px]">{row.courseTitle}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{row.programme}</span>
                      <div className="text-[11px] text-slate-500">Sem {row.semester}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800">{row.section}</span>
                      <div className="text-[10px] text-slate-400">{row.shift}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {row.credits}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {row.theoryCredits}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {row.labCredits}
                    </td>

                    <td className="py-3 px-4">
                      {row.facultyAssigned === 'Unassigned' ? (
                        <button
                          onClick={() => setActiveAllocationForModal(row)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <UserPlus size={12} />
                          <span>Assign Faculty</span>
                        </button>
                      ) : (
                        <div 
                          onClick={() => !isLockedForUser && setActiveAllocationForModal(row)}
                          className={`group cursor-pointer ${isLockedForUser ? 'cursor-not-allowed' : ''}`}
                        >
                          <div className="font-bold text-slate-900 group-hover:text-academic-700 transition-colors">
                            {row.facultyAssigned}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {row.facultyCode} • {row.facultyDesignation}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {row.previousFaculty}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.workloadStatus === 'warning'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : row.workloadStatus === 'unassigned'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {row.workloadImpact}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {row.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Lock size={10} /> HOD Approved
                        </span>
                      )}
                      {row.status === 'under_review' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={10} /> Under Review
                        </span>
                      )}
                      {row.status === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveAllocationForModal(row)}
                        disabled={isLockedForUser}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isLockedForUser
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-academic-600 hover:bg-academic-700 text-white shadow-xs'
                        }`}
                        title={isLockedForUser ? 'Locked by HOD' : 'Configure Allocation'}
                      >
                        {isLockedForUser ? 'Locked' : row.facultyAssigned === 'Unassigned' ? 'Assign' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Mobile Responsive Stacked Card Layout */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredAndSortedAllocations.map((row) => (
          <div
            key={row.id}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-xs text-academic-700">{row.courseCode}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{row.courseTitle}</h3>
                <p className="text-xs text-slate-500">
                  {row.programme} • Sem {row.semester} • {row.section} ({row.shift})
                </p>
              </div>

              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {row.credits}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Assigned Faculty:</span>
                <div className="font-bold text-slate-900">{row.facultyAssigned}</div>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <div className="font-semibold capitalize text-slate-800">{row.status}</div>
              </div>
              <div>
                <span className="text-slate-400">Previous Cycle:</span>
                <div className="text-slate-600">{row.previousFaculty}</div>
              </div>
              <div>
                <span className="text-slate-400">Workload Impact:</span>
                <div className="font-semibold text-academic-800">{row.workloadImpact}</div>
              </div>
            </div>

            <button
              onClick={() => setActiveAllocationForModal(row)}
              className="w-full py-2 rounded-lg bg-academic-600 hover:bg-academic-700 text-white font-semibold text-xs shadow-xs"
            >
              Configure Course Allocation
            </button>
          </div>
        ))}
      </div>

      {/* 5. Course Assignment & Real-Time Workload Modal */}
      {activeAllocationForModal && (
        <CourseAssignmentModal
          allocation={activeAllocationForModal}
          onClose={() => setActiveAllocationForModal(null)}
          onSaveAssignment={handleSaveAssignment}
        />
      )}

    </div>
  );
};

