import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { FacultyDetailModal } from '../components/faculty/FacultyDetailModal';
import { 
  Users, 
  Search, 
  Plus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Activity,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Statutory Workload standard defaults by rank
const STATUTORY_LIMITS = {
  'Professor': { min: 3.0, max: 9.0, eligibility: 'Theory & Lab' },
  'Associate Professor': { min: 6.0, max: 12.0, eligibility: 'Theory & Lab' },
  'Assistant Professor': { min: 9.0, max: 12.0, eligibility: 'Theory & Lab' },
  'Lecturer': { min: 12.0, max: 15.0, eligibility: 'Theory & Lab' },
  'Lab Engineer': { min: 12.0, max: 18.0, eligibility: 'Lab Only' },
  'Visiting Lecturer': { min: 3.0, max: 6.0, eligibility: 'Theory & Lab' },
};

// Default seed faculty (Dr. Amina Tariq at 12.0 Cr is BALANCED)
const DEFAULT_FACULTY = [
  {
    id: 'fac-1',
    code: 'FAC-001',
    name: 'Dr. Kamran Malik',
    designation: 'Professor',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Theory & Lab',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 1,
    theoryHours: 3.0,
    labHours: 0.0,
    totalLoad: 3.0,
    maxHours: 9.0,
    minHours: 3.0,
    specialization: ['Distributed Systems', 'Cloud Computing', 'Operating Systems'],
    email: 'haiderwahla199@gmail.com',
    fromDB: true,
  },
  {
    id: 'fac-2',
    code: 'FAC-002',
    name: 'Dr. Shafiq Ur Rehman',
    designation: 'Professor',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Theory Only',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 2,
    theoryHours: 6.0,
    labHours: 0.0,
    totalLoad: 6.0,
    maxHours: 9.0,
    minHours: 6.0,
    specialization: ['Algorithms', 'Theory of Computation', 'Data Structures'],
    email: 'dr.shafiq@university.edu',
    fromDB: true,
  },
  {
    id: 'fac-3',
    code: 'FAC-003',
    name: 'Dr. Amina Tariq',
    designation: 'Assistant Professor',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSSE',
    eligibility: 'Theory & Lab',
    status: 'Balanced', // 12.0 Cr <= 12.0 Cr Max Limit => Balanced
    activeStatus: 'Active',
    coursesCount: 3,
    theoryHours: 9.0,
    labHours: 3.0,
    totalLoad: 12.0,
    maxHours: 12.0,
    minHours: 9.0,
    specialization: ['Database Systems', 'Data Science', 'Big Data Analytics'],
    email: 'dr.amina@university.edu',
    fromDB: true,
  },
  {
    id: 'fac-4',
    code: 'FAC-004',
    name: 'Engr. Bilal Hassan',
    designation: 'Lecturer',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Theory & Lab',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 3,
    theoryHours: 6.0,
    labHours: 7.0,
    totalLoad: 13.0,
    maxHours: 15.0,
    minHours: 12.0,
    specialization: ['Data Structures', 'C++ Programming', 'Object Oriented Programming'],
    email: 'engr.bilal@university.edu',
    fromDB: true,
  },
  {
    id: 'fac-5',
    code: 'FAC-005',
    name: 'Dr. Sarah Ahmed',
    designation: 'Associate Professor',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSSE',
    eligibility: 'Theory Only',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 2,
    theoryHours: 9.0,
    labHours: 0.0,
    totalLoad: 9.0,
    maxHours: 12.0,
    minHours: 6.0,
    specialization: ['Software Engineering', 'Requirements Engineering', 'Agile Methodologies'],
    email: 'dr.sarah@university.edu',
    fromDB: true,
  },
  {
    id: 'fac-6',
    code: 'FAC-006',
    name: 'Engr. Usman Tariq',
    designation: 'Lab Engineer',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Lab Only',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 4,
    theoryHours: 0.0,
    labHours: 14.0,
    totalLoad: 14.0,
    maxHours: 18.0,
    minHours: 12.0,
    specialization: ['Computer Networks Lab', 'Hardware Interfacing', 'Digital Logic'],
    email: 'engr.usman@university.edu',
    fromDB: true,
  },
  {
    id: 'fac-7',
    code: 'VIS-001',
    name: 'Ms. Zainab Farooq',
    designation: 'Visiting Lecturer',
    employmentType: 'visiting',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Theory & Lab',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 2,
    theoryHours: 3.0,
    labHours: 3.0,
    totalLoad: 6.0,
    maxHours: 6.0,
    minHours: 3.0,
    specialization: ['DevOps', 'Cloud Architecture', 'Kubernetes'],
    email: 'zainab.visiting@industry.org',
    fromDB: true,
  },
  {
    id: 'fac-8',
    code: 'VIS-002',
    name: 'Engr. Haris Mehmood',
    designation: 'Visiting Lecturer',
    employmentType: 'visiting',
    dedicatedProgramme: 'MSCS',
    eligibility: 'Theory Only',
    status: 'Balanced',
    activeStatus: 'Active',
    coursesCount: 1,
    theoryHours: 3.0,
    labHours: 0.0,
    totalLoad: 3.0,
    maxHours: 6.0,
    minHours: 3.0,
    specialization: ['Deep Learning', 'Computer Vision', 'PyTorch'],
    email: 'haris.visiting@industry.org',
    fromDB: true,
  },
];

// Helper to determine workload compliance status
const computeWorkloadStatus = (totalLoad, minHours, maxHours) => {
  const load = Number(totalLoad || 0);
  const max = Number(maxHours || 12.0);
  const min = Number(minHours || 6.0);
  if (load > max) return 'Overloaded';
  if (load < min && load > 0) return 'Underloaded';
  return 'Balanced';
};

// Map backend faculty response to UI structure
const mapBackendFaculty = (f) => {
  const des = f.designation || 'Assistant Professor';
  const limits = STATUTORY_LIMITS[des] || { min: 6.0, max: 12.0, eligibility: 'Theory & Lab' };
  const minHours = Number(f.min_credit_hours !== undefined ? f.min_credit_hours : limits.min);
  const maxHours = Number(f.max_credit_hours !== undefined ? f.max_credit_hours : limits.max);
  const theoryHours = Number(f.current_theory_hours || 0);
  const labHours = Number(f.current_lab_hours || 0);
  const totalLoad = Number(f.current_workload || (theoryHours + labHours));
  
  return {
    id: f.id,
    code: f.faculty_code || 'FAC',
    name: f.full_name || f.name || '',
    designation: des,
    employmentType: f.employment_type || (f.visiting_faculty ? 'visiting' : 'full_time'),
    dedicatedProgramme: f.department?.includes('SE') ? 'BSSE' : 'BSCS',
    eligibility: limits.eligibility,
    status: computeWorkloadStatus(totalLoad, minHours, maxHours),
    activeStatus: f.is_active ? 'Active' : 'Inactive',
    coursesCount: f.courses_count || 1,
    theoryHours,
    labHours,
    totalLoad,
    maxHours,
    minHours,
    specialization: Array.isArray(f.specialization) ? f.specialization : [],
    email: f.email || '',
    fromDB: true,
  };
};

// â”€â”€â”€ Add Faculty Modal Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AddFacultyModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '',
    facultyCode: '',
    email: '',
    phone: '',
    designation: 'Assistant Professor',
    employmentType: 'full_time',
    dedicatedProgramme: 'BSCS',
    eligibility: 'Theory & Lab',
    minHours: 9.0,
    maxHours: 12.0,
    skillInput: '',
    specialization: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleDesignationChange = (des) => {
    const limits = STATUTORY_LIMITS[des] || { min: 6.0, max: 12.0, eligibility: 'Theory & Lab' };
    const isVisiting = des.includes('Visiting');
    setForm(f => ({
      ...f,
      designation: des,
      employmentType: isVisiting ? 'visiting' : 'full_time',
      minHours: limits.min,
      maxHours: limits.max,
      eligibility: limits.eligibility,
    }));
  };

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.specialization.includes(s)) {
      setForm(f => ({ ...f, specialization: [...f.specialization, s], skillInput: '' }));
    }
  };

  const removeSkill = (s) => {
    setForm(f => ({ ...f, specialization: f.specialization.filter(item => item !== s) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.facultyCode.trim()) {
      setError('Name, Faculty Code, and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: form.name.trim(),
        faculty_code: form.facultyCode.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || '0300-0000000',
        department: form.dedicatedProgramme === 'BSSE' ? 'Software Engineering' : 'Computer Science',
        designation: form.designation,
        employment_type: form.employmentType,
        specialization: form.specialization,
        min_credit_hours: Number(form.minHours),
        max_credit_hours: Number(form.maxHours),
      };

      const res = await api.createFaculty(payload);
      let savedFaculty;
      if (res?.success && res?.data?.id) {
        savedFaculty = mapBackendFaculty(res.data);
      } else {
        savedFaculty = {
          id: `fac-local-${Date.now()}`,
          code: payload.faculty_code,
          name: payload.full_name,
          designation: payload.designation,
          employmentType: payload.employment_type,
          dedicatedProgramme: form.dedicatedProgramme,
          eligibility: form.eligibility,
          status: 'Balanced',
          activeStatus: 'Active',
          coursesCount: 0,
          theoryHours: 0.0,
          labHours: 0.0,
          totalLoad: 0.0,
          maxHours: Number(form.maxHours),
          minHours: Number(form.minHours),
          specialization: payload.specialization,
          email: payload.email,
          fromDB: false,
        };
      }

      onSaved(savedFaculty);
    } catch (err) {
      setError(err.message || 'Failed to save faculty.');
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
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Add New Faculty Member</h2>
              <p className="text-xs text-white/80">Saved directly to PostgreSQL database with statutory limits</p>
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

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name *</label>
              <input
                type="text" required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dr. Muhammad Ali"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Faculty Code *</label>
              <input
                type="text" required
                value={form.facultyCode}
                onChange={e => setForm(f => ({ ...f, facultyCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. FAC-009 or VIS-004"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Official Email *</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="e.g. m.ali@university.edu"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Phone Contact</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0300-1234567"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
            </div>
          </div>

          {/* Designation & Programme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Academic Designation *</label>
              <select
                value={form.designation}
                onChange={e => handleDesignationChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                <option value="Professor">Professor (3 - 9 Cr)</option>
                <option value="Associate Professor">Associate Professor (6 - 12 Cr)</option>
                <option value="Assistant Professor">Assistant Professor (9 - 12 Cr)</option>
                <option value="Lecturer">Lecturer (12 - 15 Cr)</option>
                <option value="Lab Engineer">Lab Engineer (12 - 18 Cr)</option>
                <option value="Visiting Lecturer">Visiting Lecturer (3 - 6 Cr)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Dedicated Programme</label>
              <select
                value={form.dedicatedProgramme}
                onChange={e => setForm(f => ({ ...f, dedicatedProgramme: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
              >
                <option value="BSCS">BS Computer Science (BSCS)</option>
                <option value="BSSE">BS Software Engineering (BSSE)</option>
                <option value="MSCS">MS Computer Science (MSCS)</option>
              </select>
            </div>
          </div>

          {/* Statutory Workload Boundaries */}
          <div className="p-3.5 rounded-xl bg-academic-50/70 border border-academic-200">
            <div className="text-xs font-bold text-academic-900 uppercase tracking-wider mb-2">
              Statutory Workload Limits (HEC Guideline)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Min Threshold:</span>
                <div className="font-bold text-academic-800 font-mono mt-0.5">{form.minHours} Cr/sem</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Max Limit:</span>
                <div className="font-bold text-academic-800 font-mono mt-0.5">{form.maxHours} Cr/sem</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Teaching Eligibility:</span>
                <div className="font-bold text-slate-800 mt-0.5">{form.eligibility}</div>
              </div>
            </div>
          </div>

          {/* Specialization Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Domain Specializations</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.skillInput}
                onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Type domain expertise and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-academic-500"
              />
              <button type="button" onClick={addSkill} className="px-3 py-2 rounded-xl bg-academic-100 hover:bg-academic-200 text-academic-800 text-xs font-bold transition-colors">
                Add Tag
              </button>
            </div>
            {form.specialization.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.specialization.map(s => (
                  <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-academic-50 text-academic-800 border border-academic-200">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-academic-500 hover:text-red-600">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Database synchronized automatically</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Saving to DB...</span></>
                ) : (
                  <><Plus size={14} /><span>Register Faculty</span></>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// â”€â”€â”€ Main FacultyPage Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FacultyPage = () => {
  const { showToast, currentUser, allocations, convenerPermissions } = useApp();
  const isHOD = currentUser?.role === 'hod';
  const canAddFaculty = isHOD || convenerPermissions?.canAddFaculty?.allowed;
  const canDeleteFaculty = isHOD || convenerPermissions?.canDeleteFaculty?.allowed;

  // Faculty Directory State
  const [facultyData, setFacultyData] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_faculty_directory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_FACULTY;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View mode & tab filters
  const [viewMode, setViewMode] = useState('roster'); // 'roster' | 'matrix'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'permanent' | 'visiting'

  // Search & Dropdown Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Detail Modal
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Fetch from backend DB
  const fetchFaculty = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getFacultyList();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(mapBackendFaculty);
        setFacultyData(mapped);
        localStorage.setItem('cs_faculty_directory', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn('Faculty fetch fallback:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Dynamic real-time workload sync with allocations
  const enrichedFacultyData = useMemo(() => {
    return facultyData.map(f => {
      // Find allocations assigned to this faculty member
      const facultyAllocations = (allocations || []).filter(a => 
        a.facultyAssigned === f.name || a.facultyCode === f.code || a.facultyId === f.id
      );

      let calcTheory = 0;
      let calcLab = 0;
      if (facultyAllocations.length > 0) {
        facultyAllocations.forEach(a => {
          calcTheory += Number(a.theoryCredits || 0);
          calcLab += Number(a.labCredits || 0);
        });
      } else {
        calcTheory = f.theoryHours;
        calcLab = f.labHours;
      }

      const totalLoad = calcTheory + calcLab;
      const status = computeWorkloadStatus(totalLoad, f.minHours, f.maxHours);

      return {
        ...f,
        theoryHours: calcTheory,
        labHours: calcLab,
        totalLoad,
        coursesCount: facultyAllocations.length > 0 ? facultyAllocations.length : f.coursesCount,
        status,
      };
    });
  }, [facultyData, allocations]);

  // Handle new faculty saved
  const handleFacultySaved = (newFaculty) => {
    setFacultyData(prev => {
      const next = [newFaculty, ...prev];
      localStorage.setItem('cs_faculty_directory', JSON.stringify(next));
      return next;
    });
    setIsModalOpen(false);
    showToast(
      `${newFaculty.name} (${newFaculty.code}) registered successfully!${newFaculty.fromDB ? ' (Saved to DB âœ“)' : ' (Saved locally)'}`,
      newFaculty.fromDB ? 'success' : 'info'
    );
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!facultyToDelete) return;
    setIsDeleting(true);
    try {
      if (facultyToDelete.fromDB) {
        await api.deleteFaculty(facultyToDelete.id).catch(e => {
          console.warn('Delete API fallback:', e.message);
        });
      }
      setFacultyData(prev => {
        const next = prev.filter(f => f.id !== facultyToDelete.id);
        localStorage.setItem('cs_faculty_directory', JSON.stringify(next));
        return next;
      });
      showToast(`Faculty member ${facultyToDelete.name} removed successfully.`, 'success');
      setFacultyToDelete(null);
    } catch (err) {
      showToast('Failed to delete faculty: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort
  const filteredAndSortedFaculty = useMemo(() => {
    return enrichedFacultyData
      .filter((f) => {
        if (activeTab === 'permanent' && f.employmentType !== 'full_time') return false;
        if (activeTab === 'visiting' && f.employmentType !== 'visiting') return false;

        const search = searchTerm.toLowerCase();
        const matchesSearch =
          (f.name || '').toLowerCase().includes(search) ||
          (f.code || '').toLowerCase().includes(search) ||
          (f.designation || '').toLowerCase().includes(search) ||
          (f.specialization || []).some((s) => s.toLowerCase().includes(search));

        if (!matchesSearch) return false;

        if (filterProgramme !== 'ALL' && f.dedicatedProgramme !== filterProgramme) return false;
        if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;

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
  }, [enrichedFacultyData, activeTab, searchTerm, filterProgramme, filterStatus, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-400 opacity-60 ml-1 inline" />;
    return sortOrder === 'asc'
      ? <ArrowUp size={13} className="text-academic-600 font-bold ml-1 inline" />
      : <ArrowDown size={13} className="text-academic-600 font-bold ml-1 inline" />;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users size={24} className="text-academic-600" />
            <span>Faculty Management &amp; Workload Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Separate rosters for Permanent and Visiting faculty with statutory workload compliance monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Workload Matrix vs Roster View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'roster'
                  ? 'bg-white text-academic-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roster View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-academic-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={13} />
              <span>Workload Matrix</span>
            </button>
          </div>

          <button
            onClick={fetchFaculty}
            disabled={isLoading}
            title="Refresh faculty directory from database"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canAddFaculty && (
            <button
              id="add-faculty-btn"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>+ Add Faculty</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Segmented Tabs: All / Permanent / Visiting */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Faculty', count: enrichedFacultyData.length },
          { id: 'permanent', label: 'Permanent Faculty', count: enrichedFacultyData.filter(f => f.employmentType === 'full_time').length },
          { id: 'visiting', label: 'Visiting Faculty', count: enrichedFacultyData.filter(f => f.employmentType === 'visiting').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-academic-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Search & Filter Strip */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, ID, Designation, Skill..."
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
            <option value="ALL">All Programmes</option>
            <option value="BSCS">BSCS</option>
            <option value="BSSE">BSSE</option>
            <option value="MSCS">MSCS</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-academic-500"
          >
            <option value="ALL">All Workload Statuses</option>
            <option value="Balanced">Balanced (Optimal)</option>
            <option value="Overloaded">Overloaded (Exceeds Max)</option>
            <option value="Underloaded">Underloaded (Below Min)</option>
          </select>

          {(searchTerm || filterProgramme !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterProgramme('ALL'); setFilterStatus('ALL'); }}
              className="text-xs text-academic-700 font-semibold hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-xs">
          <Loader2 size={16} className="animate-spin text-academic-600" />
          <span>Loading faculty directory from database...</span>
        </div>
      )}

      {/* 4. Desktop Data Table */}
      {!isLoading && (
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                {viewMode === 'roster' ? (
                  <tr>
                    <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Faculty Name &amp; ID {renderSortIndicator('name')}
                    </th>
                    <th onClick={() => handleSort('designation')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Designation {renderSortIndicator('designation')}
                    </th>
                    <th onClick={() => handleSort('employmentType')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Type {renderSortIndicator('employmentType')}
                    </th>
                    <th onClick={() => handleSort('dedicatedProgramme')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Dedicated Programme {renderSortIndicator('dedicatedProgramme')}
                    </th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th onClick={() => handleSort('status')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Workload Status {renderSortIndicator('status')}
                    </th>
                    <th className="py-3 px-4 text-center">Load (Cr)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                ) : (
                  /* Workload Matrix View Columns */
                  <tr>
                    <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Faculty Name {renderSortIndicator('name')}
                    </th>
                    <th onClick={() => handleSort('coursesCount')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 text-center">
                      Courses {renderSortIndicator('coursesCount')}
                    </th>
                    <th onClick={() => handleSort('theoryHours')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 text-center">
                      Theory (Cr) {renderSortIndicator('theoryHours')}
                    </th>
                    <th onClick={() => handleSort('labHours')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 text-center">
                      Lab (Cr) {renderSortIndicator('labHours')}
                    </th>
                    <th onClick={() => handleSort('totalLoad')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 text-center">
                      Total Load {renderSortIndicator('totalLoad')}
                    </th>
                    <th className="py-3 px-4 text-center">Max Allowed</th>
                    <th onClick={() => handleSort('status')} className="py-3 px-4 cursor-pointer hover:bg-slate-100">
                      Compliance Badge {renderSortIndicator('status')}
                    </th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedFaculty.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFaculty(f)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {viewMode === 'roster' ? (
                      /* Roster View Row */
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-academic-700 transition-colors">
                            {f.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{f.code}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">{f.designation}</td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.employmentType === 'full_time'
                              ? 'bg-academic-50 text-academic-800 border border-academic-200'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}>
                            {f.employmentType === 'full_time' ? 'Permanent' : 'Visiting'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {f.dedicatedProgramme}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-600 font-medium">{f.eligibility}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            f.status === 'Overloaded'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : f.status === 'Underloaded'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {f.status === 'Overloaded' && <ShieldAlert size={12} />}
                            {f.status === 'Balanced' && <CheckCircle2 size={12} />}
                            {f.status === 'Underloaded' && <AlertTriangle size={12} />}
                            <span>{f.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                          {Number(f.totalLoad || 0).toFixed(1)} / {Number(f.maxHours || 12).toFixed(1)} Cr
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedFaculty(f)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-academic-50 text-slate-700 hover:text-academic-700 border border-slate-200 text-xs font-semibold"
                            >
                              View History
                            </button>
                            {canDeleteFaculty && (
                              <button
                                onClick={() => setFacultyToDelete(f)}
                                title="Delete Faculty Member"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Workload Matrix View Row */
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-academic-700">
                            {f.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{f.designation}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {f.coursesCount}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                          {Number(f.theoryHours || 0).toFixed(1)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                          {Number(f.labHours || 0).toFixed(1)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-950">
                          {Number(f.totalLoad || 0).toFixed(1)} Cr
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {Number(f.maxHours || 12).toFixed(1)} Cr
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            f.status === 'Overloaded'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : f.status === 'Underloaded'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {f.status === 'Overloaded' && <ShieldAlert size={12} />}
                            {f.status === 'Balanced' && <CheckCircle2 size={12} />}
                            {f.status === 'Underloaded' && <AlertTriangle size={12} />}
                            <span>{f.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedFaculty(f)}
                              className="text-academic-700 hover:text-academic-900 font-semibold text-xs flex items-center gap-1"
                            >
                              <Eye size={13} />
                              <span>Inspect</span>
                            </button>
                            {canDeleteFaculty && (
                              <button
                                onClick={() => setFacultyToDelete(f)}
                                title="Delete Faculty Member"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Mobile Responsive Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredAndSortedFaculty.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelectedFaculty(f)}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  {f.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{f.name}</h3>
                <p className="text-xs text-academic-700">{f.designation}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  f.status === 'Overloaded'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : f.status === 'Underloaded'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {f.status}
                </span>
                {canDeleteFaculty && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFacultyToDelete(f);
                    }}
                    title="Delete Faculty"
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Programme:</span>
                <div className="font-semibold text-slate-800">{f.dedicatedProgramme}</div>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>
                <div className="font-semibold capitalize text-slate-800">
                  {f.employmentType === 'full_time' ? 'Permanent' : 'Visiting'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Total / Max Load:</span>
                <div className="font-bold text-slate-900">{f.totalLoad} / {f.maxHours} Cr</div>
              </div>
              <div>
                <span className="text-slate-400">Eligibility:</span>
                <div className="text-slate-700 font-medium">{f.eligibility}</div>
              </div>
            </div>

            <button className="w-full py-1.5 text-center text-xs font-semibold text-academic-700 bg-academic-50 rounded-lg hover:bg-academic-100 transition-colors">
              Tap to View Allocations &amp; History
            </button>
          </div>
        ))}
      </div>

      {/* 6. Faculty Detailed Allocation History Modal */}
      {selectedFaculty && (
        <FacultyDetailModal
          faculty={selectedFaculty}
          onClose={() => setSelectedFaculty(null)}
        />
      )}

      {/* 7. Add Faculty Modal */}
      {isModalOpen && (
        <AddFacultyModal
          onClose={() => setIsModalOpen(false)}
          onSaved={handleFacultySaved}
        />
      )}

      {/* 8. HOD Delete Faculty Confirmation Dialog */}
      {facultyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Delete Faculty Member</h3>
                  <p className="text-xs text-white/80">HOD Authorization Required</p>
                </div>
              </div>
              <button
                onClick={() => setFacultyToDelete(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <p className="font-bold">Are you sure you want to remove this faculty member?</p>
                <p className="text-slate-700">
                  Faculty: <strong className="font-mono text-slate-900">{facultyToDelete.code}</strong> â€” {facultyToDelete.name} ({facultyToDelete.designation})
                </p>
              </div>

              <p className="text-xs text-slate-500">
                This will remove the faculty record from the department directory and database. This action cannot be undone.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFacultyToDelete(null)}
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

export default FacultyPage;

