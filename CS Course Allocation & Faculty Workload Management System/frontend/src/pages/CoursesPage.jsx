import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  BookOpen,
  Search,
  Plus,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

// â”€â”€â”€ Default seed courses (shown when backend unavailable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEFAULT_COURSES = [
  { id: '1', code: 'CS-101', title: 'Introduction to ICT & Programming Fundamentals', programme: 'BSCS', semester: 1, creditStructure: '4(3,1)', theoryHours: 3, labHours: 1, totalCredits: 4, expertise: ['C/C++ Fundamentals', 'Problem Solving', 'Structured Programming'], type: 'hybrid' },
  { id: '2', code: 'CS-201', title: 'Data Structures & Algorithms', programme: 'BSCS', semester: 3, creditStructure: '4(3,1)', theoryHours: 3, labHours: 1, totalCredits: 4, expertise: ['Data Structures', 'Tree Traversals', 'C++ STL', 'Algorithmic Complexity'], type: 'hybrid' },
  { id: '3', code: 'CS-202', title: 'Database Systems', programme: 'BSCS', semester: 3, creditStructure: '4(3,1)', theoryHours: 3, labHours: 1, totalCredits: 4, expertise: ['Relational Algebra', 'PostgreSQL', 'SQL Optimization', 'ER Modeling'], type: 'hybrid' },
  { id: '4', code: 'CS-301', title: 'Operating Systems', programme: 'BSCS', semester: 5, creditStructure: '4(3,1)', theoryHours: 3, labHours: 1, totalCredits: 4, expertise: ['Kernel Architecture', 'Concurrency & Threads', 'Memory Management', 'Linux Syscalls'], type: 'hybrid' },
  { id: '5', code: 'CS-305', title: 'Artificial Intelligence', programme: 'BSCS', semester: 5, creditStructure: '3(3,0)', theoryHours: 3, labHours: 0, totalCredits: 3, expertise: ['Search Algorithms', 'Heuristics', 'Knowledge Representation', 'Machine Learning Basics'], type: 'theory' },
  { id: '6', code: 'SE-302', title: 'Software Requirements Engineering', programme: 'BSSE', semester: 3, creditStructure: '3(3,0)', theoryHours: 3, labHours: 0, totalCredits: 3, expertise: ['UML Modeling', 'Requirements Elicitation', 'Agile User Stories', 'SRS Standards'], type: 'theory' },
  { id: '7', code: 'SE-401', title: 'Software Design & Architecture', programme: 'BSSE', semester: 5, creditStructure: '3(3,0)', theoryHours: 3, labHours: 0, totalCredits: 3, expertise: ['Design Patterns', 'Microservices', 'Clean Architecture', 'System Scalability'], type: 'theory' },
  { id: '8', code: 'CS-701', title: 'Advanced Analysis of Algorithms', programme: 'MSCS', semester: 1, creditStructure: '3(3,0)', theoryHours: 3, labHours: 0, totalCredits: 3, expertise: ['NP-Completeness', 'Approximation Algorithms', 'Randomized Algorithms', 'Graph Theory'], type: 'theory' },
  { id: '9', code: 'CS-705', title: 'Advanced Cloud & Distributed Systems', programme: 'MSCS', semester: 2, creditStructure: '3(3,0)', theoryHours: 3, labHours: 0, totalCredits: 3, expertise: ['Distributed Consensus (Raft/Paxos)', 'Kubernetes', 'CAP Theorem', 'Fault Tolerance'], type: 'theory' },
];

// â”€â”€â”€ Credit string parser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const parseCreditStr = (val) => {
  const match = String(val).match(/^(\d+)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    const total = parseInt(match[1]);
    const theory = parseInt(match[2]);
    const lab = parseInt(match[3]);
    if (total === theory + lab) {
      return { valid: true, total, theory, lab, contact: theory + lab * 3 };
    }
  }
  return { valid: false, total: 0, theory: 0, lab: 0, contact: 0 };
};

// â”€â”€â”€ Map backend course to UI shape â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mapBackendCourse = (c) => ({
  id: c.id,
  code: c.course_code || c.code || '',
  title: c.title || '',
  programme: c.programme || c.department || 'BSCS',
  semester: c.recommended_semester || c.semester || 1,
  creditStructure: c.credit_string || `${Number(c.theory_credit_hours || 0) + Number(c.lab_credit_hours || 0)}(${c.theory_credit_hours || 0},${c.lab_credit_hours || 0})`,
  theoryHours: Number(c.theory_credit_hours || 0),
  labHours: Number(c.lab_credit_hours || 0),
  totalCredits: Number(c.theory_credit_hours || 0) + Number(c.lab_credit_hours || 0),
  expertise: Array.isArray(c.required_expertise) ? c.required_expertise : (Array.isArray(c.expertise) ? c.expertise : []),
  type: c.course_type || c.type || 'theory',
  fromDB: true,
});

// â”€â”€â”€ Add Course Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AddCourseModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    courseCode: '',
    title: '',
    programme: 'BSCS',
    semester: 1,
    creditString: '3(3,0)',
    courseType: 'theory',
    isElective: false,
    expertiseInput: '',
    expertise: [],
  });
  const [parsed, setParsed] = useState({ valid: true, total: 3, theory: 3, lab: 0, contact: 3 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreditChange = (val) => {
    const result = parseCreditStr(val);
    setParsed(result);
    setForm(f => ({
      ...f,
      creditString: val,
      courseType: result.valid ? (result.lab > 0 ? 'hybrid' : 'theory') : f.courseType,
    }));
  };

  const addExpertise = () => {
    const tag = form.expertiseInput.trim();
    if (tag && !form.expertise.includes(tag)) {
      setForm(f => ({ ...f, expertise: [...f.expertise, tag], expertiseInput: '' }));
    }
  };

  const removeExpertise = (tag) => {
    setForm(f => ({ ...f, expertise: f.expertise.filter(e => e !== tag) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.courseCode.trim() || !form.title.trim()) {
      setError('Course Code and Title are required.');
      return;
    }
    if (!parsed.valid) {
      setError('Invalid credit string. Format: Total(Theory,Lab)  e.g. 4(3,1)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        course_code: form.courseCode.trim().toUpperCase(),
        title: form.title.trim(),
        department: 'Computer Science',
        programme: form.programme,
        credit_string: form.creditString.trim(),
        recommended_semester: Number(form.semester),
        course_type: form.courseType,
        is_elective: form.isElective,
        required_expertise: form.expertise,
      };

      const res = await api.createCourse(payload);

      let savedCourse;
      if (res?.success && res?.data?.id) {
        savedCourse = mapBackendCourse(res.data);
      } else {
        savedCourse = {
          id: `local-${Date.now()}`,
          code: payload.course_code,
          title: payload.title,
          programme: payload.programme,
          semester: payload.recommended_semester,
          creditStructure: payload.credit_string,
          theoryHours: parsed.theory,
          labHours: parsed.lab,
          totalCredits: parsed.total,
          expertise: payload.required_expertise,
          type: payload.course_type,
          fromDB: false,
        };
      }

      onSaved(savedCourse);
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-academic-800 via-academic-700 to-academic-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Add New Course</h2>
              <p className="text-xs text-white/80">Data will be saved to the PostgreSQL database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Code + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Course Code *</label>
              <input
                type="text" required
                value={form.courseCode}
                onChange={e => setForm(f => ({ ...f, courseCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. CS-401"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Course Title *</label>
              <input
                type="text" required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Computer Networks"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
          </div>

          {/* Row 2: Programme + Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Degree Programme</label>
              <select
                value={form.programme}
                onChange={e => setForm(f => ({ ...f, programme: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                <option value="BSCS">BSCS</option>
                <option value="BSSE">BSSE</option>
                <option value="MSCS">MSCS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Recommended Semester</label>
              <select
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: parseInt(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Credit String */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Credit Structure (HEC Format) *
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={form.creditString}
                onChange={e => handleCreditChange(e.target.value)}
                placeholder="e.g. 4(3,1)"
                className={`w-36 px-3 py-2.5 rounded-xl border font-mono font-bold text-sm focus:outline-none focus:ring-2 ${
                  parsed.valid ? 'border-emerald-300 bg-emerald-50 text-academic-900 focus:ring-academic-500' : 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400'
                }`}
              />
              {parsed.valid ? (
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-academic-50 border border-academic-200 text-academic-800">Total: {parsed.total} Cr</span>
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700">Theory: {parsed.theory} Cr</span>
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700">Lab: {parsed.lab} Cr</span>
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700">Contact: {parsed.contact} hrs/wk</span>
                </div>
              ) : (
                <span className="text-xs text-red-600 font-medium">Invalid â€” use Total(Theory,Lab) e.g. <strong>4(3,1)</strong></span>
              )}
            </div>
          </div>

          {/* Row 4: Course Type + Elective */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Course Type</label>
              <select
                value={form.courseType}
                onChange={e => setForm(f => ({ ...f, courseType: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                <option value="theory">Theory Only</option>
                <option value="lab">Lab Only</option>
                <option value="hybrid">Hybrid (Theory + Lab)</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200 w-full">
                <input
                  type="checkbox"
                  checked={form.isElective}
                  onChange={e => setForm(f => ({ ...f, isElective: e.target.checked }))}
                  className="w-4 h-4 text-academic-600 rounded focus:ring-academic-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Elective Course</div>
                  <div className="text-[11px] text-slate-500">Optional for degree</div>
                </div>
              </label>
            </div>
          </div>

          {/* Row 5: Expertise Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Required Expertise Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.expertiseInput}
                onChange={e => setForm(f => ({ ...f, expertiseInput: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExpertise(); } }}
                placeholder="Type a skill and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
              <button type="button" onClick={addExpertise} className="px-3 py-2 rounded-xl bg-academic-100 hover:bg-academic-200 text-academic-800 text-xs font-bold transition-colors">
                Add Tag
              </button>
            </div>
            {form.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.expertise.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-academic-50 text-academic-800 border border-academic-200">
                    {tag}
                    <button type="button" onClick={() => removeExpertise(tag)} className="text-academic-500 hover:text-red-600">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Saved via POST /api/v1/courses â†’ PostgreSQL</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !parsed.valid}
                className="px-6 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Saving to DB...</span></>
                ) : (
                  <><Plus size={14} /><span>Save Course</span></>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// â”€â”€â”€ Main CoursesPage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const CoursesPage = () => {
  const { showToast, currentUser, convenerPermissions } = useApp();
  const isHOD = currentUser?.role === 'hod';
  const canAddCourses = isHOD || convenerPermissions?.canAddCourses?.allowed;
  const canDeleteCourses = isHOD || convenerPermissions?.canDeleteCourses?.allowed;

  const [courseList, setCourseList] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_courses_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COURSES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null); // { id, code, title, fromDB }
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [sortField, setSortField] = useState('code');
  const [sortOrder, setSortOrder] = useState('asc');
  const [liveCreditInput, setLiveCreditInput] = useState('4(3,1)');

  const parsedPreview = useMemo(() => parseCreditStr(liveCreditInput), [liveCreditInput]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getCoursesList();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapBackendCourse);
        setCourseList(mapped);
        localStorage.setItem('cs_courses_catalog', JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Course fetch fallback:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleCourseSaved = (newCourse) => {
    setCourseList(prev => {
      const next = [newCourse, ...prev];
      localStorage.setItem('cs_courses_catalog', JSON.stringify(next));
      return next;
    });
    setIsModalOpen(false);
    showToast(
      `${newCourse.code} — "${newCourse.title}" added${newCourse.fromDB ? ' and saved to database ✓' : ' locally (backend offline)'}`,
      newCourse.fromDB ? 'success' : 'info'
    );
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      // Try backend delete for DB courses
      if (courseToDelete.fromDB) {
        await api.deleteCourse(courseToDelete.id).catch(err => {
          console.warn('Delete API fallback:', err.message);
        });
      }
      // Remove from local state and localStorage regardless
      setCourseList(prev => {
        const next = prev.filter(c => c.id !== courseToDelete.id);
        localStorage.setItem('cs_courses_catalog', JSON.stringify(next));
        return next;
      });
      showToast(`Course ${courseToDelete.code} — "${courseToDelete.title}" deleted successfully.`, 'success');
      setCourseToDelete(null);
    } catch (err) {
      showToast('Failed to delete course: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAndSortedCourses = useMemo(() => {
    return courseList
      .filter(c => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          (c.code || '').toLowerCase().includes(search) ||
          (c.title || '').toLowerCase().includes(search) ||
          (c.expertise || []).some(e => e.toLowerCase().includes(search));
        if (!matchesSearch) return false;
        if (filterProgramme !== 'ALL' && c.programme !== filterProgramme) return false;
        if (filterSemester !== 'ALL' && String(c.semester) !== filterSemester) return false;
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField], valB = b[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [courseList, searchTerm, filterProgramme, filterSemester, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-400 opacity-60 ml-1 inline" />;
    return sortOrder === 'asc'
      ? <ArrowUp size={13} className="text-academic-600 ml-1 inline" />
      : <ArrowDown size={13} className="text-academic-600 ml-1 inline" />;
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen size={24} className="text-academic-600" />
            <span>Course Catalog &amp; Curriculum Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master list of departmental courses, credit structures, and domain competency requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCourses}
            disabled={isLoading}
            title="Refresh from database"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {canAddCourses && (
            <button
              id="add-course-btn"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>+ Add Course</span>
            </button>
          )}
        </div>
      </div>

      {/* HEC Credit Parser Widget */}
      <div className="p-4 rounded-xl bg-academic-50/80 border border-academic-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-academic-900">
            <Sparkles size={14} className="text-academic-600" />
            <span>HEC Credit Parser Widget</span>
          </div>
          <span className="text-[11px] text-academic-700 font-semibold">Formula: Total(Theory, Lab)</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={liveCreditInput}
            onChange={e => setLiveCreditInput(e.target.value)}
            placeholder="e.g. 3(2,1)"
            className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-academic-300 font-mono font-bold text-sm bg-white text-academic-950 focus:outline-none focus:ring-2 focus:ring-academic-500"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-academic-950">
            {['total', 'theory', 'lab'].map(k => (
              <span key={k} className="px-2 py-1 bg-white rounded-md border border-academic-200 shadow-2xs capitalize">
                {k === 'total' ? 'Total Credits' : k}: <strong className="text-academic-700">{parsedPreview[k]} Cr</strong>
              </span>
            ))}
            <span className="px-2 py-1 bg-white rounded-md border border-academic-200 shadow-2xs">
              Contact Hours: <strong className="text-academic-700">{parsedPreview.contact} hrs/wk</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Code, Title, or Required Expertise..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select value={filterProgramme} onChange={e => setFilterProgramme(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500">
            <option value="ALL">All Programmes</option>
            <option value="BSCS">BSCS</option>
            <option value="BSSE">BSSE</option>
            <option value="MSCS">MSCS</option>
          </select>
          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500">
            <option value="ALL">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
          </select>
          <span className="text-xs text-slate-400 font-medium ml-1">{filteredAndSortedCourses.length} courses</span>
          {(searchTerm || filterProgramme !== 'ALL' || filterSemester !== 'ALL') && (
            <button onClick={() => { setSearchTerm(''); setFilterProgramme('ALL'); setFilterSemester('ALL'); }} className="text-xs text-academic-700 font-semibold hover:underline px-2">Reset</button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs">
          <Loader2 size={16} className="animate-spin text-academic-600" />
          <span>Loading courses from database...</span>
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && (
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th onClick={() => handleSort('code')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">Course Code {renderSortIcon('code')}</th>
                  <th onClick={() => handleSort('title')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">Course Title {renderSortIcon('title')}</th>
                  <th onClick={() => handleSort('programme')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">Programme {renderSortIcon('programme')}</th>
                  <th onClick={() => handleSort('semester')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">Semester {renderSortIcon('semester')}</th>
                  <th onClick={() => handleSort('totalCredits')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">Credit Structure {renderSortIcon('totalCredits')}</th>
                  <th className="py-3 px-4">Required Expertise</th>
                  <th className="py-3 px-4 text-center">Source</th>
                  {canDeleteCourses && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={canDeleteCourses ? 8 : 7} className="py-12 text-center text-slate-400 text-xs">No courses match the selected filters.</td>
                  </tr>
                ) : filteredAndSortedCourses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-academic-900">{course.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{course.title}</div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{course.type} course</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-800">{course.programme}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">Semester {course.semester}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                      <span className="px-2 py-0.5 rounded bg-academic-50 text-academic-800 border border-academic-200">{course.creditStructure}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(course.expertise || []).slice(0, 3).map((exp, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">{exp}</span>
                        ))}
                        {(course.expertise || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">+{course.expertise.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {course.fromDB ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={10} /> DB
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Local</span>
                      )}
                    </td>
                    {canDeleteCourses && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setCourseToDelete(course)}
                          title="Delete Course"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredAndSortedCourses.map(course => (
            <div key={course.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-academic-50 text-academic-800 border border-academic-200">{course.code}</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{course.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800">{course.creditStructure}</span>
                  {canDeleteCourses && (
                    <button
                      onClick={() => setCourseToDelete(course)}
                      title="Delete Course"
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>Programme: <strong className="text-slate-800">{course.programme}</strong></span>
                <span>•</span>
                <span>Semester: <strong className="text-slate-800">{course.semester}</strong></span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Required Expertise:</span>
                <div className="flex flex-wrap gap-1">
                  {(course.expertise || []).map((exp, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">{exp}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {isModalOpen && (
        <AddCourseModal
          onClose={() => setIsModalOpen(false)}
          onSaved={handleCourseSaved}
        />
      )}

      {/* HOD-Only Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Delete Course</h3>
                  <p className="text-xs text-white/80">HOD Authorization Required</p>
                </div>
              </div>
              <button
                onClick={() => setCourseToDelete(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-bold">Are you sure you want to delete this course?</p>
                <p className="text-slate-700">
                  Course: <strong className="font-mono text-slate-900">{courseToDelete.code}</strong> — {courseToDelete.title}
                </p>
              </div>

              <p className="text-xs text-slate-500">
                This will remove the course curriculum record from the system and database. This action cannot be undone.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCourseToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoursesPage;


