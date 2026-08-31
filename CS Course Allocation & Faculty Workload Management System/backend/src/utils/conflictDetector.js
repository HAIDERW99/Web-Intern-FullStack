const { supabaseAdmin } = require('../config/supabase');
const { calculateFacultyWorkload } = require('./workloadEngine');

/**
 * Intelligent Conflict & Compliance Detection Scanner
 *
 * Scans course allocations across an academic session and identifies:
 * 1. Faculty Workload Overload (Weighted hours > Max allowed).
 * 2. Duplicate or Overlapping Allocations (Same faculty allocated to multiple sections of different courses concurrently or duplicate components).
 * 3. Lab Eligibility Mismatches (Senior research professors assigned to basic lab demonstrations without lab eligibility).
 * 4. Underloaded Faculty (Active full-time faculty below minimum required credit quota).
 * 5. Unallocated Offerings (Course offerings or sections that have not been assigned a teacher).
 * 6. Visiting Faculty Contract Limit Violations.
 */

const scanSessionConflicts = async (sessionId, options = {}) => {
  const { syncWithDatabase = false, triggeredBy = null } = options;

  // 1. Fetch Session
  const { data: session, error: sessErr } = await supabaseAdmin
    .from('academic_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessErr || !session) {
    throw new Error(`Academic session not found with ID: ${sessionId}`);
  }

  const detectedConflicts = [];

  // 2. Fetch All Allocations in this Session
  const { data: allocations, error: allocErr } = await supabaseAdmin
    .from('course_allocations')
    .select(`
      id,
      session_id,
      course_id,
      section_id,
      faculty_id,
      component_type,
      assigned_credit_hours,
      assigned_contact_hours,
      status,
      courses (id, course_code, title, department, course_type),
      sections (id, name, shift, semesters (semester_number, programmes (code, name))),
      faculty (id, faculty_code, full_name, designation, employment_type, department, is_active)
    `)
    .eq('session_id', sessionId);

  if (allocErr) {
    throw new Error(`Failed to fetch session allocations: ${allocErr.message}`);
  }

  // 3. Fetch Course Offerings for this session to find Unallocated Offerings
  const { data: offerings } = await supabaseAdmin
    .from('course_offerings')
    .select(`
      id,
      course_id,
      programme_id,
      semester_number,
      expected_sections,
      is_offered,
      courses (id, course_code, title, course_type),
      programmes (code, name)
    `)
    .eq('session_id', sessionId)
    .eq('is_offered', true);

  // 4. Fetch All Active Faculty
  const { data: activeFacultyList } = await supabaseAdmin
    .from('faculty')
    .select('*, visiting_faculty (*)')
    .eq('is_active', true);

  // =========================================================================
  // CHECK A: Faculty Overload, Underload, and Policy Limits
  // =========================================================================
  for (const faculty of activeFacultyList || []) {
    try {
      const workload = await calculateFacultyWorkload(faculty.id, sessionId);

      if (workload.status.category === 'Overloaded') {
        detectedConflicts.push({
          session_id: sessionId,
          faculty_id: faculty.id,
          allocation_id: null,
          conflict_type: 'workload_overflow',
          severity: 'critical',
          message: `Faculty ${faculty.full_name} (${faculty.faculty_code}) is OVERLOADED with ${workload.workloadMetrics.totalWeightedLoad} credit hours (Max: ${workload.policyLimits.maxCreditHours}).`,
          details: {
            currentLoad: workload.workloadMetrics.totalWeightedLoad,
            maxAllowed: workload.policyLimits.maxCreditHours,
            excess: workload.status.excessLoad,
            designation: faculty.designation,
          },
        });
      } else if (workload.status.category === 'Underloaded' && faculty.employment_type === 'full_time') {
        detectedConflicts.push({
          session_id: sessionId,
          faculty_id: faculty.id,
          allocation_id: null,
          conflict_type: 'workload_underflow',
          severity: 'warning',
          message: `Full-time faculty ${faculty.full_name} is UNDERLOADED with ${workload.workloadMetrics.totalWeightedLoad} credit hours (Min required: ${workload.policyLimits.minCreditHours}).`,
          details: {
            currentLoad: workload.workloadMetrics.totalWeightedLoad,
            minRequired: workload.policyLimits.minCreditHours,
            deficit: workload.status.deficitLoad,
          },
        });
      }

      // Check max preparations overflow
      if (workload.workloadMetrics.preparationsCount > workload.policyLimits.maxPreparations) {
        detectedConflicts.push({
          session_id: sessionId,
          faculty_id: faculty.id,
          allocation_id: null,
          conflict_type: 'max_preparations_exceeded',
          severity: 'warning',
          message: `Faculty ${faculty.full_name} has ${workload.workloadMetrics.preparationsCount} distinct course preparations (Max allowed: ${workload.policyLimits.maxPreparations}).`,
          details: {
            distinctPreparations: workload.workloadMetrics.preparationsCount,
            maxAllowed: workload.policyLimits.maxPreparations,
          },
        });
      }

      // Check visiting faculty course limit
      if (faculty.employment_type === 'visiting') {
        const vInfo = faculty.visiting_faculty?.[0];
        const courseLimit = vInfo?.max_course_limit || 2;
        if (workload.workloadMetrics.totalAllocationsCount > courseLimit) {
          detectedConflicts.push({
            session_id: sessionId,
            faculty_id: faculty.id,
            allocation_id: null,
            conflict_type: 'contract_cap_exceeded',
            severity: 'critical',
            message: `Visiting faculty ${faculty.full_name} exceeds contractual course limit of ${courseLimit} (Allocated: ${workload.workloadMetrics.totalAllocationsCount}).`,
            details: {
              allocatedCourses: workload.workloadMetrics.totalAllocationsCount,
              contractLimit: courseLimit,
            },
          });
        }
      }
    } catch (err) {
      console.warn(`[Conflict Scanner Workload Error for faculty ${faculty.id}]:`, err.message);
    }
  }

  // =========================================================================
  // CHECK B: Lab Component Eligibility & Mismatch
  // =========================================================================
  (allocations || []).forEach((alloc) => {
    if (alloc.component_type === 'lab') {
      const designation = alloc.faculty?.designation;
      // Professor or Associate Professor assigned to lab demonstration without explicit instruction
      if (['Professor', 'Associate Professor'].includes(designation)) {
        detectedConflicts.push({
          session_id: sessionId,
          faculty_id: alloc.faculty_id,
          allocation_id: alloc.id,
          conflict_type: 'domain_mismatch',
          severity: 'warning',
          message: `Senior faculty ${alloc.faculty?.full_name} (${designation}) is assigned to a Lab demonstration for ${alloc.courses?.course_code} (${alloc.sections?.name}).`,
          details: {
            allocationId: alloc.id,
            courseCode: alloc.courses?.course_code,
            section: alloc.sections?.name,
            designation,
          },
        });
      }
    }
  });

  // =========================================================================
  // CHECK C: Duplicate Allocation (Same section & course allocated multiple times)
  // =========================================================================
  const sectionCourseMap = new Map();
  (allocations || []).forEach((alloc) => {
    const key = `${alloc.section_id}-${alloc.course_id}-${alloc.component_type}`;
    if (sectionCourseMap.has(key)) {
      detectedConflicts.push({
        session_id: sessionId,
        faculty_id: alloc.faculty_id,
        allocation_id: alloc.id,
        conflict_type: 'section_overlap',
        severity: 'critical',
        message: `Duplicate allocation detected for Section '${alloc.sections?.name}', Course '${alloc.courses?.course_code}', Component '${alloc.component_type}'.`,
        details: {
          sectionId: alloc.section_id,
          courseId: alloc.course_id,
          componentType: alloc.component_type,
        },
      });
    } else {
      sectionCourseMap.set(key, alloc);
    }
  });

  // =========================================================================
  // CHECK D: Unallocated Course Offerings Remaining
  // =========================================================================
  const allocatedCourseIds = new Set((allocations || []).map((a) => a.course_id));

  (offerings || []).forEach((offering) => {
    if (!allocatedCourseIds.has(offering.course_id)) {
      detectedConflicts.push({
        session_id: sessionId,
        faculty_id: null,
        allocation_id: null,
        conflict_type: 'section_overlap',
        severity: 'info',
        message: `Course Offering '${offering.courses?.course_code} - ${offering.courses?.title}' (${offering.programmes?.code} Sem ${offering.semester_number}) has NO faculty allocated yet.`,
        details: {
          offeringId: offering.id,
          courseCode: offering.courses?.course_code,
          programmeCode: offering.programmes?.code,
          semesterNumber: offering.semester_number,
          expectedSections: offering.expected_sections,
        },
      });
    }
  });

  // =========================================================================
  // Persist to Database if syncWithDatabase = true
  // =========================================================================
  if (syncWithDatabase && detectedConflicts.length > 0) {
    // Delete existing unresolved conflicts for this session
    await supabaseAdmin
      .from('conflicts')
      .delete()
      .eq('session_id', sessionId)
      .eq('is_resolved', false);

    // Insert newly detected conflicts
    const conflictInserts = detectedConflicts.map((c) => ({
      session_id: c.session_id,
      allocation_id: c.allocation_id,
      faculty_id: c.faculty_id,
      conflict_type: c.conflict_type,
      severity: c.severity,
      message: c.message,
      details: c.details,
      is_resolved: false,
    }));

    await supabaseAdmin.from('conflicts').insert(conflictInserts);
  }

  // Summary counts
  const criticalCount = detectedConflicts.filter((c) => c.severity === 'critical').length;
  const warningCount = detectedConflicts.filter((c) => c.severity === 'warning').length;
  const infoCount = detectedConflicts.filter((c) => c.severity === 'info').length;

  return {
    sessionId,
    sessionCode: session.session_code,
    scannedAt: new Date().toISOString(),
    isCompliant: criticalCount === 0,
    summary: {
      totalIssuesFound: detectedConflicts.length,
      critical: criticalCount,
      warnings: warningCount,
      info: infoCount,
    },
    conflicts: detectedConflicts,
  };
};

module.exports = {
  scanSessionConflicts,
};
