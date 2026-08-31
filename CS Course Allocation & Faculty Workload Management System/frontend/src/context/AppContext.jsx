import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Active academic session (Persistent)
  const [currentSession, setCurrentSession] = useState(() => {
    const saved = localStorage.getItem('cs_active_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.session_code) return parsed;
      } catch (e) {}
    }
    return {
      id: 'b0000000-0000-0000-0000-000000000001',
      session_code: 'FA25',
      name: 'Fall Semester 2025',
      is_locked: false,
      is_current: true,
    };
  });

  // Academic Sessions List (Persistent)
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('cs_academic_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { 
        id: 'b0000000-0000-0000-0000-000000000001',
        code: 'FA25', 
        name: 'Fall Semester 2025', 
        start_date: '2025-09-01',
        end_date: '2026-01-20',
        dates: 'Sep 1, 2025 – Jan 20, 2026', 
        isCurrent: true, 
        isLocked: false, 
        offeringsCount: 72 
      },
      { 
        id: 'b0000000-0000-0000-0000-000000000002',
        code: 'SP26', 
        name: 'Spring Semester 2026', 
        start_date: '2026-02-01',
        end_date: '2026-06-25',
        dates: 'Feb 1, 2026 – Jun 25, 2026', 
        isCurrent: false, 
        isLocked: true, 
        offeringsCount: 68 
      },
    ];
  });

  const addAcademicSession = (newSess) => {
    setSessions(prev => {
      let next = prev;
      if (newSess.isCurrent) {
        next = next.map(s => ({ ...s, isCurrent: false }));
      }
      next = [newSess, ...next];
      localStorage.setItem('cs_academic_sessions', JSON.stringify(next));
      return next;
    });

    if (newSess.isCurrent) {
      const activeObj = {
        id: newSess.id,
        session_code: newSess.code,
        name: newSess.name,
        is_locked: newSess.isLocked || false,
        is_current: true,
      };
      setCurrentSession(activeObj);
      localStorage.setItem('cs_active_session', JSON.stringify(activeObj));
    }
  };

  const updateSessionLock = (sessionCode, isLocked) => {
    setSessions(prev => {
      const next = prev.map(s => s.code === sessionCode ? { ...s, isLocked } : s);
      localStorage.setItem('cs_academic_sessions', JSON.stringify(next));
      return next;
    });
    if (currentSession?.session_code === sessionCode) {
      setCurrentSession(c => {
        const updated = { ...c, is_locked: isLocked };
        localStorage.setItem('cs_active_session', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const selectActiveSession = (sessionObj) => {
    setSessions(prev => {
      const next = prev.map(s => ({ ...s, isCurrent: s.code === sessionObj.code }));
      localStorage.setItem('cs_academic_sessions', JSON.stringify(next));
      return next;
    });
    const activeObj = {
      id: sessionObj.id,
      session_code: sessionObj.code,
      name: sessionObj.name,
      is_locked: sessionObj.isLocked || false,
      is_current: true,
    };
    setCurrentSession(activeObj);
    localStorage.setItem('cs_active_session', JSON.stringify(activeObj));
  };

  // Unallocated / Remaining Courses State (Persistent)
  const [unallocatedCourses, setUnallocatedCourses] = useState(() => {
    const saved = localStorage.getItem('cs_unallocated_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'rem-1',
        code: 'CS-301',
        title: 'Operating Systems',
        programme: 'BSCS',
        semester: 5,
        section: 'Section A',
        shift: 'Morning',
        creditStructure: '4(3,1)',
        theoryCredits: 3.0,
        labCredits: 1.0,
        previousFaculty: 'Dr. Kamran Malik (SP24)',
        recommendedFaculty: {
          name: 'Dr. Shafiq Ur Rehman',
          designation: 'Professor',
          matchScore: 96,
        },
        status: 'Unassigned',
        missingPart: 'Theory & Lab',
      },
      {
        id: 'rem-2',
        code: 'CS-202',
        title: 'Database Systems',
        programme: 'BSCS',
        semester: 3,
        section: 'Section B',
        shift: 'Morning',
        creditStructure: '4(3,1)',
        theoryCredits: 3.0,
        labCredits: 1.0,
        previousFaculty: 'Dr. Amina Tariq (FA24)',
        recommendedFaculty: {
          name: 'Engr. Bilal Hassan',
          designation: 'Lecturer',
          matchScore: 88,
        },
        status: 'Lab Missing',
        missingPart: 'Lab Demonstrator Only',
      },
      {
        id: 'rem-3',
        code: 'CS-305',
        title: 'Artificial Intelligence',
        programme: 'BSCS',
        semester: 5,
        section: 'Section A',
        shift: 'Morning',
        creditStructure: '3(3,0)',
        theoryCredits: 3.0,
        labCredits: 0.0,
        previousFaculty: 'Dr. Sarah Ahmed (FA24)',
        recommendedFaculty: {
          name: 'Ms. Zainab Farooq',
          designation: 'Visiting Lecturer',
          matchScore: 82,
        },
        status: 'Unassigned',
        missingPart: 'Theory Instructor',
      },
      {
        id: 'rem-4',
        code: 'SE-401',
        title: 'Software Design & Architecture',
        programme: 'BSSE',
        semester: 5,
        section: 'Section A',
        shift: 'Morning',
        creditStructure: '3(3,0)',
        theoryCredits: 3.0,
        labCredits: 0.0,
        previousFaculty: 'Dr. Sarah Ahmed (SP24)',
        recommendedFaculty: {
          name: 'Dr. Sarah Ahmed',
          designation: 'Associate Professor',
          matchScore: 94,
        },
        status: 'Unassigned',
        missingPart: 'Theory Instructor',
      },
    ];
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cs_is_authenticated') === 'true';
  });

  // Current authenticated user (Default: HOD user credentials)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cs_user_profile');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // Fallback to default
      }
    }
    return {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Dr. Kamran Malik',
      role: 'hod', // 'hod' | 'convener' | 'faculty_member'
      designation: 'Professor & Head of Department',
      department: 'Department of Computer Science',
      email: 'haiderwahla199@gmail.com',
      avatar: 'KM',
    };
  });

  // Navigation State: 'landing' when logged out, 'dashboard' when logged in
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('cs_is_authenticated') === 'true' ? 'dashboard' : 'landing';
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Convener Role Permissions Policy (Configurable in real time by HOD)
  const [convenerPermissions, setConvenerPermissions] = useState(() => {
    const saved = localStorage.getItem('cs_convener_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return {
      canProposeAllocations: {
        id: 'canProposeAllocations',
        name: 'Propose Course Allocations',
        description: 'Assign faculty to course sections in Draft / Under Review status for department curriculum',
        category: 'Course Allocation',
        allowed: true,
      },
      canViewWorkloadMatrix: {
        id: 'canViewWorkloadMatrix',
        name: 'View Workload Matrix & Faculty Directory',
        description: 'Inspect teaching loads, HEC statutory boundaries, and faculty specializations',
        category: 'Workload & Faculty',
        allowed: true,
      },
      canViewRemainingCourses: {
        id: 'canViewRemainingCourses',
        name: 'View & Assign Unallocated Courses',
        description: 'Identify unassigned course sections and assign candidate instructors',
        category: 'Curriculum & Offering',
        allowed: true,
      },
      canExportReports: {
        id: 'canExportReports',
        name: 'Export Allocation Sheets & Reports',
        description: 'Download CSV and PDF reports of proposed course assignments',
        category: 'Reports & Export',
        allowed: true,
      },
      canAddCourses: {
        id: 'canAddCourses',
        name: 'Add New Course to Master Catalog',
        description: 'Create new departmental curriculum and HEC credit formulas',
        category: 'Curriculum & Offering',
        allowed: false,
      },
      canDeleteCourses: {
        id: 'canDeleteCourses',
        name: 'Delete Courses from Catalog',
        description: 'Permanently remove courses from the department master database',
        category: 'Curriculum & Offering',
        allowed: false,
      },
      canAddFaculty: {
        id: 'canAddFaculty',
        name: 'Register New Faculty Members',
        description: 'Add new permanent or visiting faculty records with rank and credit caps',
        category: 'Workload & Faculty',
        allowed: false,
      },
      canDeleteFaculty: {
        id: 'canDeleteFaculty',
        name: 'Delete Faculty Records',
        description: 'Permanently remove faculty profiles and teaching records',
        category: 'Workload & Faculty',
        allowed: false,
      },
      canApproveAllocations: {
        id: 'canApproveAllocations',
        name: 'Final Allocation Approval & Sign-Off',
        description: 'Grant official departmental approval and sign-off on allocation proposals',
        category: 'Governance & Approval',
        allowed: false,
      },
      canManageSessions: {
        id: 'canManageSessions',
        name: 'Create & Freeze Academic Sessions',
        description: 'Initiate new academic semesters (FA25, SP26) and apply session locks',
        category: 'Academic Planning',
        allowed: false,
      },
    };
  });

  // Modal display states for Convener & HOD permissions popups
  const [showConvenerPermissionsModal, setShowConvenerPermissionsModal] = useState(false);
  const [showHODPermissionsModal, setShowHODPermissionsModal] = useState(false);

  // Update a single permission in real time
  const updateConvenerPermission = (permissionId, isAllowed) => {
    setConvenerPermissions(prev => {
      const updated = {
        ...prev,
        [permissionId]: {
          ...prev[permissionId],
          allowed: isAllowed,
        },
      };
      localStorage.setItem('cs_convener_permissions', JSON.stringify(updated));
      return updated;
    });
    const permName = convenerPermissions[permissionId]?.name || permissionId;
    showToast(`Convener Permission updated: "${permName}" is now ${isAllowed ? 'ALLOWED' : 'RESTRICTED'}`, 'info');
  };

  // Reset to statutory defaults
  const resetConvenerPermissions = () => {
    const defaultPerms = {
      canProposeAllocations: { id: 'canProposeAllocations', name: 'Propose Course Allocations', description: 'Assign faculty to course sections in Draft / Under Review status for department curriculum', category: 'Course Allocation', allowed: true },
      canViewWorkloadMatrix: { id: 'canViewWorkloadMatrix', name: 'View Workload Matrix & Faculty Directory', description: 'Inspect teaching loads, HEC statutory boundaries, and faculty specializations', category: 'Workload & Faculty', allowed: true },
      canViewRemainingCourses: { id: 'canViewRemainingCourses', name: 'View & Assign Unallocated Courses', description: 'Identify unassigned course sections and assign candidate instructors', category: 'Curriculum & Offering', allowed: true },
      canExportReports: { id: 'canExportReports', name: 'Export Allocation Sheets & Reports', description: 'Download CSV and PDF reports of proposed course assignments', category: 'Reports & Export', allowed: true },
      canAddCourses: { id: 'canAddCourses', name: 'Add New Course to Master Catalog', description: 'Create new departmental curriculum and HEC credit formulas', category: 'Curriculum & Offering', allowed: false },
      canDeleteCourses: { id: 'canDeleteCourses', name: 'Delete Courses from Catalog', description: 'Permanently remove courses from the department master database', category: 'Curriculum & Offering', allowed: false },
      canAddFaculty: { id: 'canAddFaculty', name: 'Register New Faculty Members', description: 'Add new permanent or visiting faculty records with rank and credit caps', category: 'Workload & Faculty', allowed: false },
      canDeleteFaculty: { id: 'canDeleteFaculty', name: 'Delete Faculty Records', description: 'Permanently remove faculty profiles and teaching records', category: 'Workload & Faculty', allowed: false },
      canApproveAllocations: { id: 'canApproveAllocations', name: 'Final Allocation Approval & Sign-Off', description: 'Grant official departmental approval and sign-off on allocation proposals', category: 'Governance & Approval', allowed: false },
      canManageSessions: { id: 'canManageSessions', name: 'Create & Freeze Academic Sessions', description: 'Initiate new academic semesters (FA25, SP26) and apply session locks', category: 'Academic Planning', allowed: false },
    };
    setConvenerPermissions(defaultPerms);
    localStorage.setItem('cs_convener_permissions', JSON.stringify(defaultPerms));
    showToast('Convener permissions reset to statutory department defaults', 'info');
  };

  // Sync Supabase Auth state on mount
  useEffect(() => {
    let isMounted = true;
    let authListener = null;

    const checkSupabaseSession = async () => {
      try {
        if (!supabase?.auth?.getSession) return;
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (isMounted && session && session.user) {
          setIsAuthenticated(true);
          const meta = session.user.user_metadata || {};
          const userObj = {
            id: session.user.id,
            name: meta.full_name || 'Dr. Kamran Malik',
            role: meta.system_role || 'hod',
            designation: meta.designation || 'Professor & Head of Department',
            department: meta.department || 'Department of Computer Science',
            email: session.user.email || 'haiderwahla199@gmail.com',
            avatar: (meta.full_name || 'KM').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'KM',
          };
          setCurrentUser(userObj);
          localStorage.setItem('cs_is_authenticated', 'true');
          localStorage.setItem('cs_user_profile', JSON.stringify(userObj));
          localStorage.setItem('cs_auth_token', session.access_token);
        }
      } catch (err) {
        console.warn('Supabase session check fallback:', err?.message || err);
      }
    };

    checkSupabaseSession();

    // Listen for auth changes
    try {
      if (supabase?.auth?.onAuthStateChange) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (isMounted && event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setActiveTab('landing');
            localStorage.removeItem('cs_is_authenticated');
            localStorage.removeItem('cs_user_profile');
            localStorage.removeItem('cs_auth_token');
          }
        });
        authListener = data;
      }
    } catch (err) {
      console.warn('Supabase auth listener setup note:', err);
    }

    return () => {
      isMounted = false;
      try {
        authListener?.subscription?.unsubscribe?.();
      } catch (e) {
        // Safe fallback
      }
    };
  }, []);

  // Global Allocations Matrix State (Persistent Real-Time Sync)
  const [allocations, setAllocations] = useState(() => {
    const saved = localStorage.getItem('cs_allocations_matrix');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'alloc-1',
        courseCode: 'CS-201',
        courseTitle: 'Data Structures & Algorithms',
        credits: '4(3,1)',
        programme: 'BSCS',
        semester: 3,
        section: 'Section A',
        shift: 'Morning',
        theoryCredits: 3.0,
        labCredits: 1.0,
        facultyId: 'fac-1',
        facultyAssigned: 'Dr. Shafiq Ur Rehman',
        facultyDesignation: 'Professor',
        facultyCode: 'FAC-002',
        previousFaculty: 'Dr. Shafiq Ur Rehman (FA24)',
        workloadImpact: '+3.5 Cr (Balanced)',
        workloadStatus: 'optimal',
        status: 'approved',
        approvedBy: 'Dr. Kamran Malik (HOD)',
        remarks: 'Assigned core algorithms instruction',
      },
      {
        id: 'alloc-2',
        courseCode: 'CS-201',
        courseTitle: 'Data Structures Lab',
        credits: '1(0,1)',
        programme: 'BSCS',
        semester: 3,
        section: 'Section A',
        shift: 'Morning',
        theoryCredits: 0.0,
        labCredits: 1.0,
        facultyId: 'fac-3',
        facultyAssigned: 'Engr. Bilal Hassan',
        facultyDesignation: 'Lecturer',
        facultyCode: 'FAC-004',
        previousFaculty: 'Engr. Bilal Hassan (FA24)',
        workloadImpact: '+1.0 Cr (Balanced)',
        workloadStatus: 'optimal',
        status: 'approved',
        approvedBy: 'Dr. Kamran Malik (HOD)',
        remarks: 'Lab session in Computer Lab 3',
      },
      {
        id: 'alloc-3',
        courseCode: 'CS-202',
        courseTitle: 'Database Systems',
        credits: '4(3,1)',
        programme: 'BSCS',
        semester: 3,
        section: 'Section A',
        shift: 'Morning',
        theoryCredits: 3.0,
        labCredits: 1.0,
        facultyId: 'fac-4',
        facultyAssigned: 'Dr. Amina Tariq',
        facultyDesignation: 'Assistant Professor',
        facultyCode: 'FAC-003',
        previousFaculty: 'Dr. Amina Tariq (SP24)',
        workloadImpact: '+3.5 Cr (Balanced 12.0/12.0 Cr)',
        workloadStatus: 'optimal',
        status: 'under_review',
        approvedBy: null,
        remarks: 'Awaiting HOD approval on faculty load',
      },
      {
        id: 'alloc-4',
        courseCode: 'CS-301',
        courseTitle: 'Operating Systems',
        credits: '4(3,1)',
        programme: 'BSCS',
        semester: 5,
        section: 'Section A',
        shift: 'Morning',
        theoryCredits: 3.0,
        labCredits: 1.0,
        facultyId: null,
        facultyAssigned: 'Unassigned',
        facultyDesignation: '—',
        facultyCode: '—',
        previousFaculty: 'Dr. Kamran Malik (SP24)',
        workloadImpact: 'Unallocated (+3.5 Cr)',
        workloadStatus: 'unassigned',
        status: 'draft',
        approvedBy: null,
        remarks: 'Priority allocation required',
      },
      {
        id: 'alloc-5',
        courseCode: 'CS-305',
        courseTitle: 'Artificial Intelligence',
        credits: '3(3,0)',
        programme: 'BSCS',
        semester: 5,
        section: 'Section B',
        shift: 'Morning',
        theoryCredits: 3.0,
        labCredits: 0.0,
        facultyId: 'fac-5',
        facultyAssigned: 'Ms. Zainab Farooq',
        facultyDesignation: 'Visiting Lecturer',
        facultyCode: 'VIS-001',
        previousFaculty: 'Dr. Sarah Ahmed (FA24)',
        workloadImpact: '+3.0 Cr (Visiting Cap 2/2)',
        workloadStatus: 'optimal',
        status: 'draft',
        approvedBy: null,
        remarks: 'Visiting contract pending confirmation',
      },
      {
        id: 'alloc-6',
        courseCode: 'SE-302',
        courseTitle: 'Software Requirements Engineering',
        credits: '3(3,0)',
        programme: 'BSSE',
        semester: 3,
        section: 'Section A',
        shift: 'Morning',
        theoryCredits: 3.0,
        labCredits: 0.0,
        facultyId: 'fac-2',
        facultyAssigned: 'Dr. Sarah Ahmed',
        facultyDesignation: 'Associate Professor',
        facultyCode: 'FAC-005',
        previousFaculty: 'Dr. Sarah Ahmed (FA24)',
        workloadImpact: '+3.0 Cr (Balanced)',
        workloadStatus: 'optimal',
        status: 'approved',
        approvedBy: 'Dr. Kamran Malik (HOD)',
        remarks: 'BSSE core module',
      },
      {
        id: 'alloc-7',
        courseCode: 'CS-701',
        courseTitle: 'Advanced Analysis of Algorithms',
        credits: '3(3,0)',
        programme: 'MSCS',
        semester: 1,
        section: 'Section Evening',
        shift: 'Evening',
        theoryCredits: 3.0,
        labCredits: 0.0,
        facultyId: 'fac-1',
        facultyAssigned: 'Dr. Shafiq Ur Rehman',
        facultyDesignation: 'Professor',
        facultyCode: 'FAC-002',
        previousFaculty: 'Dr. Shafiq Ur Rehman (FA24)',
        workloadImpact: '+3.0 Cr (Balanced)',
        workloadStatus: 'optimal',
        status: 'approved',
        approvedBy: 'Dr. Kamran Malik (HOD)',
        remarks: 'Graduate lecture slot',
      },
    ];
  });

  // Global Conflicts Matrix State (Persistent Real-Time Sync)
  const [conflicts, setConflicts] = useState(() => {
    const saved = localStorage.getItem('cs_conflicts_matrix');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'conf-1',
        type: 'workload_overflow',
        severity: 'critical',
        title: 'Statutory Workload Overload — Dr. Amina Tariq',
        faculty: 'Dr. Amina Tariq (FAC-003)',
        programme: 'BSCS',
        semester: 3,
        course: 'CS-202 Database Systems + CS-301',
        message: 'Dr. Amina Tariq is allocated 15.0 Credit Hours against a statutory maximum of 12.0 Cr for Assistant Professor rank.',
        detail: 'Current allocations: CS-202 Theory (3 Cr), CS-202 Lab (1 Cr), CS-301 Theory (3 Cr), CS-301 Lab (1 Cr), CS-101 Theory (3 Cr), CS-101 Lab (1 Cr), CS-305 Theory (3 Cr) = 15 Cr total.',
        recommendedAction: 'Reassign CS-305 Theory (3 Cr) to an underloaded faculty member. Suggested: Dr. Shafiq Ur Rehman (6 Cr available).',
        resolveAction: 'Reassign one course section via Allocation Workspace.',
        redirectTab: 'allocations',
        detectedAt: '2026-08-29T08:32:00Z',
        status: 'unresolved',
      },
      {
        id: 'conf-2',
        type: 'lab_mismatch',
        severity: 'critical',
        title: 'Lab Eligibility Violation — Dr. Shafiq Ur Rehman',
        faculty: 'Dr. Shafiq Ur Rehman (FAC-002)',
        programme: 'BSCS',
        semester: 3,
        course: 'CS-201 Data Structures Lab',
        message: 'Dr. Shafiq Ur Rehman holds "Theory Only" eligibility but is assigned a laboratory demonstration session for CS-201.',
        detail: 'HEC policy requires lab sessions to be conducted by a faculty member with "Lab Eligible" or "Theory & Lab" designation (Lab Engineer or Lecturer rank minimum).',
        recommendedAction: 'Replace lab session with Engr. Usman Tariq (Lab Engineer, Lab Only eligible, 14 Cr available capacity).',
        resolveAction: 'Edit allocation in the Allocation Matrix.',
        redirectTab: 'allocations',
        detectedAt: '2026-08-29T08:32:01Z',
        status: 'unresolved',
      },
      {
        id: 'conf-3',
        type: 'unallocated_course',
        severity: 'warning',
        title: 'No Faculty Assigned — CS-301 Operating Systems',
        faculty: 'Unallocated',
        programme: 'BSCS',
        semester: 5,
        course: 'CS-301 Operating Systems (Section A, Morning)',
        message: 'CS-301 Operating Systems (BSCS Sem 5, Section A) currently has no faculty instructor assigned for Fall 2025.',
        detail: 'This is a 4-credit course (3 Theory + 1 Lab) with approximately 45 enrolled students. Session starts in 12 days.',
        recommendedAction: 'Use the AI Recommendation Engine → Top candidate: Dr. Kamran Malik (FAC-001, 88% Match, 3 Cr capacity).',
        resolveAction: 'Open Remaining Courses → Allocate.',
        redirectTab: 'remaining',
        detectedAt: '2026-08-29T08:32:02Z',
        status: 'unresolved',
      },
      {
        id: 'conf-4',
        type: 'unallocated_course',
        severity: 'warning',
        title: 'No Faculty Assigned — CS-305 Artificial Intelligence',
        faculty: 'Unallocated',
        programme: 'BSCS',
        semester: 5,
        course: 'CS-305 Artificial Intelligence (Section B, Morning)',
        message: 'CS-305 Artificial Intelligence (BSCS Sem 5, Section B) has no permanent faculty assigned. Visiting Lecturer contract is pending confirmation.',
        detail: 'Ms. Zainab Farooq (Visiting) has been informally proposed but the assignment draft has not been submitted for HOD review.',
        recommendedAction: 'Confirm visiting contract with Ms. Zainab Farooq or escalate to HOD for permanent faculty override.',
        resolveAction: 'Submit draft allocation for HOD review.',
        redirectTab: 'allocations',
        detectedAt: '2026-08-29T08:32:03Z',
        status: 'unresolved',
      },
      {
        id: 'conf-5',
        type: 'duplicate',
        severity: 'warning',
        title: 'Possible Duplicate Section Offering — CS-202',
        faculty: 'Dr. Amina Tariq',
        programme: 'BSCS',
        semester: 3,
        course: 'CS-202 Database Systems (Section A & B)',
        message: 'The same faculty (Dr. Amina Tariq) appears in two section groups for CS-202 in the same semester, which may indicate a double-booking error.',
        detail: 'CS-202 Section A is approved; CS-202 Section B is in Draft status with the same faculty. If intentional (different time slots), mark as confirmed.',
        recommendedAction: 'Verify timetable slots differ. If in conflict, reassign Section B to another instructor.',
        resolveAction: 'Verify in Allocation Matrix.',
        redirectTab: 'allocations',
        detectedAt: '2026-08-29T08:32:04Z',
        status: 'unresolved',
      },
      {
        id: 'conf-6',
        type: 'workload_overflow',
        severity: 'info',
        title: 'Underloaded Faculty — Engr. Haris Mehmood',
        faculty: 'Engr. Haris Mehmood (VIS-002)',
        programme: 'MSCS',
        semester: 1,
        course: 'CS-705 Advanced Cloud',
        message: 'Engr. Haris Mehmood (Visiting, MSCS) is carrying only 3 Cr of their minimum 3 Cr (exactly at minimum). No buffer for course drops.',
        detail: 'Visiting lecturer contracts require at least 3 Cr to remain active. Any further course drop will breach minimum contract terms and require re-negotiation.',
        recommendedAction: 'Monitor. If CS-705 is dropped, re-engage contract or reassign visiting slot.',
        resolveAction: 'No immediate action required.',
        redirectTab: 'visiting',
        detectedAt: '2026-08-29T08:32:05Z',
        status: 'unresolved',
      },
    ];
  });

  const resolveConflict = (id, note = '') => {
    setConflicts(prev => {
      const next = prev.map(c =>
        c.id === id
          ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedNote: note || 'Resolved by HOD' }
          : c
      );
      localStorage.setItem('cs_conflicts_matrix', JSON.stringify(next));
      return next;
    });
  };

  const updateAllConflicts = (newConflicts) => {
    setConflicts(newConflicts);
    localStorage.setItem('cs_conflicts_matrix', JSON.stringify(newConflicts));
  };

  // Assign remaining course globally (runs after all state is declared)
  const assignRemainingCourse = (assignedData) => {
    setUnallocatedCourses(prev => {
      const next = prev.filter(c => c.id !== assignedData.courseId && c.code !== assignedData.courseCode);
      localStorage.setItem('cs_unallocated_courses', JSON.stringify(next));
      return next;
    });
    setAllocations(prev => {
      const next = prev.map(a => {
        if (a.courseCode === assignedData.courseCode || a.id === assignedData.courseId) {
          return {
            ...a,
            facultyAssigned: assignedData.facultyName,
            facultyDesignation: assignedData.facultyDesignation || 'Assistant Professor',
            status: 'under_review',
            workloadImpact: '+3.5 Cr (Proposed)',
            workloadStatus: 'optimal',
          };
        }
        return a;
      });
      localStorage.setItem('cs_allocations_matrix', JSON.stringify(next));
      return next;
    });
    setConflicts(prev => {
      const next = prev.map(c => {
        if (c.course?.includes(assignedData.courseCode)) {
          return {
            ...c,
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolvedNote: `Auto-resolved: Allocated to ${assignedData.facultyName}`,
          };
        }
        return c;
      });
      localStorage.setItem('cs_conflicts_matrix', JSON.stringify(next));
      return next;
    });
  };

  // Ensure auth token is always set for API calls
  useEffect(() => {
    if (!localStorage.getItem('cs_auth_token')) {
      const role = currentUser?.role || 'hod';
      localStorage.setItem('cs_auth_token', `demo-token-${role}`);
    }
  }, [currentUser]);

  const updateAllocation = (updatedItem) => {
    setAllocations(prev => {
      const next = prev.map(a => a.id === updatedItem.id ? { ...a, ...updatedItem } : a);
      localStorage.setItem('cs_allocations_matrix', JSON.stringify(next));
      
      // Real-time dynamic conflict resolution sync
      setConflicts(cPrev => {
        let updatedC = [...cPrev];
        if (updatedItem.id === 'alloc-3' && updatedItem.status === 'approved') {
          updatedC = updatedC.map(c => c.id === 'conf-1' ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedNote: 'Resolved: HOD approved allocation load' } : c);
        }
        if (updatedItem.id === 'alloc-4' && updatedItem.facultyAssigned !== 'Unassigned') {
          updatedC = updatedC.map(c => c.id === 'conf-3' ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedNote: `Resolved: Assigned to ${updatedItem.facultyAssigned}` } : c);
        }
        localStorage.setItem('cs_conflicts_matrix', JSON.stringify(updatedC));
        return updatedC;
      });

      return next;
    });
  };

  const updateAllAllocations = (newAllocations) => {
    setAllocations(newAllocations);
    localStorage.setItem('cs_allocations_matrix', JSON.stringify(newAllocations));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Login handler
  const loginUser = async (userObj, token = null) => {
    setIsAuthenticated(true);
    setCurrentUser(userObj);
    localStorage.setItem('cs_is_authenticated', 'true');
    localStorage.setItem('cs_user_profile', JSON.stringify(userObj));
    const finalToken = token || `demo-token-${userObj.role || 'hod'}`;
    localStorage.setItem('cs_auth_token', finalToken);
    setActiveTab('dashboard');

    // If logging in as Convener, automatically trigger permissions guidance popup
    if (userObj.role === 'convener') {
      setShowConvenerPermissionsModal(true);
    }

    showToast(`Welcome back, ${userObj.name}!`, 'success');
  };

  // Logout handler
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut note:', e.message);
    }
    setIsAuthenticated(false);
    setActiveTab('landing');
    setShowConvenerPermissionsModal(false);
    setShowHODPermissionsModal(false);
    localStorage.removeItem('cs_is_authenticated');
    localStorage.removeItem('cs_user_profile');
    localStorage.removeItem('cs_auth_token');
    showToast('You have been logged out securely.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentSession,
        setCurrentSession,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toast,
        showToast,
        loginUser,
        logout,
        allocations,
        setAllocations: updateAllAllocations,
        updateAllocation,
        conflicts,
        setConflicts: updateAllConflicts,
        resolveConflict,
        sessions,
        addAcademicSession,
        updateSessionLock,
        selectActiveSession,
        unallocatedCourses,
        setUnallocatedCourses,
        assignRemainingCourse,
        convenerPermissions,
        setConvenerPermissions,
        updateConvenerPermission,
        resetConvenerPermissions,
        showConvenerPermissionsModal,
        setShowConvenerPermissionsModal,
        showHODPermissionsModal,
        setShowHODPermissionsModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
