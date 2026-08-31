import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { QuickAllocateModal } from '../components/allocations/QuickAllocateModal';
import { 
  Clock, 
  Search, 
  Sparkles, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  UserCheck, 
  AlertTriangle, 
  ChevronRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const RemainingCoursesPage = () => {
  const { showToast, currentSession, unallocatedCourses, assignRemainingCourse } = useApp();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState('code');
  const [sortOrder, setSortOrder] = useState('asc');

  // Allocation Modal State
  const [selectedCourseForAllocation, setSelectedCourseForAllocation] = useState(null);




  // Filtering & Sorting
  const filteredAndSorted = useMemo(() => {
    return unallocatedCourses
      .filter((item) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.recommendedFaculty.name.toLowerCase().includes(search) ||
          item.previousFaculty.toLowerCase().includes(search);

        if (!matchesSearch) return false;

        if (filterProgramme !== 'ALL' && item.programme !== filterProgramme) return false;
        if (filterSemester !== 'ALL' && String(item.semester) !== filterSemester) return false;

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
  }, [unallocatedCourses, searchTerm, filterProgramme, filterSemester, sortField, sortOrder]);

  // Group by Programme for Section View
  const groupedByProgramme = useMemo(() => {
    const groups = {};
    filteredAndSorted.forEach((item) => {
      const key = `${item.programme} (Semester ${item.semester})`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredAndSorted]);

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

  const handleAssignSuccess = (assignedData) => {
    // Persist removal globally (updates localStorage + conflicts + allocations)
    assignRemainingCourse(assignedData);
    setSelectedCourseForAllocation(null);
    showToast(
      `Successfully assigned ${assignedData.courseCode} to ${assignedData.facultyName} — submitted for HOD review.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock size={24} className="text-amber-600" />
            <span>Remaining & Unassigned Course Sections</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sections in session {currentSession.session_code} requiring teacher allocation, grouped by degree programme & semester
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200">
            {unallocatedCourses.length} Unallocated Sections Remaining
          </span>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search unallocated courses or recommended faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Degree Programmes</option>
            <option value="BSCS">BSCS</option>
            <option value="BSSE">BSSE</option>
            <option value="MSCS">MSCS</option>
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="3">Semester 3</option>
            <option value="5">Semester 5</option>
          </select>

          {(searchTerm || filterProgramme !== 'ALL' || filterSemester !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProgramme('ALL');
                setFilterSemester('ALL');
              }}
              className="text-xs text-academic-700 font-semibold hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Grouped Table View */}
      {Object.keys(groupedByProgramme).length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
          <h3 className="text-base font-bold text-slate-900">All Sections Fully Allocated!</h3>
          <p className="text-xs text-slate-500 mt-1">
            No unassigned course sections remaining for the selected criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProgramme).map(([groupTitle, courses]) => (
            <div key={groupTitle} className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
              
              {/* Group Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-academic-600" />
                  <span className="font-bold text-slate-900 text-sm">{groupTitle}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                    {courses.length} Unallocated
                  </span>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Course & Section</th>
                      <th className="py-2.5 px-4">Credit Structure</th>
                      <th className="py-2.5 px-4 text-center">Theory (Cr)</th>
                      <th className="py-2.5 px-4 text-center">Lab (Cr)</th>
                      <th className="py-2.5 px-4">Previous Faculty</th>
                      <th className="py-2.5 px-4">AI Recommended Faculty</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Direct Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.code}</div>
                          <div className="text-slate-600 font-medium">{c.title}</div>
                          <div className="text-[11px] text-slate-400">{c.section} • {c.shift}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {c.creditStructure}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                          {c.theoryCredits}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                          {c.labCredits}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {c.previousFaculty}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-slate-900">{c.recommendedFaculty.name}</div>
                              <div className="text-[11px] text-slate-400">{c.recommendedFaculty.designation}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {c.recommendedFaculty.matchScore}% Match
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {c.missingPart}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedCourseForAllocation(c)}
                            className="px-3.5 py-1.5 rounded-lg bg-academic-600 hover:bg-academic-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <Sparkles size={13} />
                            <span>Allocate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="grid grid-cols-1 divide-y divide-slate-100 md:hidden">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-academic-700">{c.code}</span>
                        <h4 className="font-bold text-slate-900 text-sm">{c.title}</h4>
                        <p className="text-xs text-slate-500">{c.section} ({c.shift})</p>
                      </div>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100">
                        {c.creditStructure}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">AI Recommendation:</span>
                        <span className="font-bold text-emerald-700">{c.recommendedFaculty.matchScore}% Match</span>
                      </div>
                      <div className="font-semibold text-slate-800">{c.recommendedFaculty.name}</div>
                    </div>

                    <button
                      onClick={() => setSelectedCourseForAllocation(c)}
                      className="w-full py-2 rounded-lg bg-academic-600 hover:bg-academic-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Allocate Course Section</span>
                    </button>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 4. Quick Allocate Assistant Modal */}
      {selectedCourseForAllocation && (
        <QuickAllocateModal
          course={selectedCourseForAllocation}
          onClose={() => setSelectedCourseForAllocation(null)}
          onAssignSuccess={handleAssignSuccess}
        />
      )}

    </div>
  );
};

