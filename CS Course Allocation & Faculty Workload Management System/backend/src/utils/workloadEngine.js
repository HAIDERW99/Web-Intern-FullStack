const { supabaseAdmin } = require('../config/supabase');

/**
 * Workload Calculation Engine
 *
 * Core engine for computing real-time faculty workload, weighted credit/contact loads,
 * preparation diversity, and dynamic compliance status against academic policy rules.
 */

// Default weights if not explicitly overridden
const DEFAULT_THEORY_WEIGHT = 1.0;
const DEFAULT_LAB_WEIGHT = 0.5; // Standard 1 Lab credit hour = 0.5 or 0.67 weighted teaching load, or 1:1

/**
 * Computes workload metrics for a specific faculty member in a given academic session.
 *
 * @param {string} facultyId - UUID of the faculty member
 * @param {string} sessionId - UUID of the academic session
 * @param {Object} [options]
 * @param {number} [options.theoryWeight=1.0] - Multiplier for theory hours
 * @param {number} [options.labWeight=0.5] - Multiplier for lab hours
 * @param {Array} [options.simulatedAllocations=[]] - Optional additional allocations to simulate before saving
 * @returns {Promise<Object>} Comprehensive workload analysis
 */
const calculateFacultyWorkload = async (facultyId, sessionId, options = {}) => {
  const {
    theoryWeight = DEFAULT_THEORY_WEIGHT,
    labWeight = DEFAULT_LAB_WEIGHT,
    simulatedAllocations = [],
  } = options;

  // 1. Fetch Faculty Profile with Visiting Details
  const { data: faculty, error: facErr } = await supabaseAdmin
    .from('faculty')
    .select(`
      *,
      visiting_faculty (*)
    `)
    .eq('id', facultyId)
    .single();

  if (facErr || !faculty) {
    throw new Error(`Faculty not found with ID: ${facultyId}`);
  }

  // 2. Fetch Workload Rule for (designation, employment_type)
  const { data: rule } = await supabaseAdmin
    .from('workload_rules')
    .select('*')
    .eq('designation', faculty.designation)
    .eq('employment_type', faculty.employment_type)
    .maybeSingle();

  // Establish bounds (prefer specific rule table, fallback to faculty profile overrides)
  const minCredits = rule ? Number(rule.min_credit_hours) : Number(faculty.min_credit_hours || 6.0);
  const maxCredits = rule ? Number(rule.max_credit_hours) : Number(faculty.max_credit_hours || 12.0);
  const maxPreparations = rule ? Number(rule.max_preparations) : Number(faculty.max_preparations || 2);
  const maxContactHours = rule ? Number(rule.max_contact_hours) : 18.0;

  // 3. Fetch Existing Course Allocations for this Faculty in this Session (excluding rejected)
  const { data: allocations, error: allocErr } = await supabaseAdmin
    .from('course_allocations')
    .select(`
      id,
      session_id,
      course_id,
      section_id,
      component_type,
      assigned_credit_hours,
      assigned_contact_hours,
      status,
      remarks,
      courses (id, course_code, title),
      sections (id, name, student_count, semesters (semester_number, programmes (code)))
    `)
    .eq('faculty_id', facultyId)
    .eq('session_id', sessionId)
    .neq('status', 'rejected');

  if (allocErr) {
    throw new Error(`Failed to fetch faculty allocations: ${allocErr.message}`);
  }

  // Combine actual database allocations with any in-memory simulated allocations
  const allAllocations = [...(allocations || []), ...simulatedAllocations];

  // 4. Calculate Aggregate Metrics
  let rawTheoryCredits = 0;
  let rawLabCredits = 0;
  let rawTheoryContactHours = 0;
  let rawLabContactHours = 0;
  const distinctCourseIds = new Set();
  const distinctSectionIds = new Set();

  allAllocations.forEach((item) => {
    const cred = Number(item.assigned_credit_hours || 0);
    const cont = Number(item.assigned_contact_hours || 0);

    if (item.course_id) distinctCourseIds.add(item.course_id);
    if (item.section_id) distinctSectionIds.add(item.section_id);

    if (item.component_type === 'theory') {
      rawTheoryCredits += cred;
      rawTheoryContactHours += cont;
    } else if (item.component_type === 'lab') {
      rawLabCredits += cred;
      rawLabContactHours += cont;
    } else {
      // hybrid/project fallback
      rawTheoryCredits += cred;
      rawTheoryContactHours += cont;
    }
  });

  // Total Load Formula: (Theory Hours * Theory Weight) + (Lab Hours * Lab Weight)
  const totalWeightedLoad = Number(
    ((rawTheoryCredits * theoryWeight) + (rawLabCredits * labWeight)).toFixed(2)
  );

  const totalRawCredits = Number((rawTheoryCredits + rawLabCredits).toFixed(2));
  const totalContactHours = Number((rawTheoryContactHours + rawLabContactHours).toFixed(2));
  const preparationsCount = distinctCourseIds.size;
  const sectionsCount = distinctSectionIds.size;

  // 5. Dynamic Status Determination
  // Thresholds:
  // - Underloaded: load < minCredits
  // - Balanced: minCredits <= load <= (maxCredits * 0.85)
  // - Near Maximum: (maxCredits * 0.85) < load <= maxCredits
  // - Overloaded: load > maxCredits
  let status = 'Balanced';
  const nearMaxThreshold = Number((maxCredits * 0.85).toFixed(2));

  if (totalWeightedLoad < minCredits) {
    status = 'Underloaded';
  } else if (totalWeightedLoad > maxCredits) {
    status = 'Overloaded';
  } else if (totalWeightedLoad > nearMaxThreshold) {
    status = 'Near Maximum';
  } else {
    status = 'Balanced';
  }

  // Check preparation & contact hour violations
  const preparationsExceeded = preparationsCount > maxPreparations;
  const contactHoursExceeded = totalContactHours > maxContactHours;

  const utilizationPercentage = Number(((totalWeightedLoad / maxCredits) * 100).toFixed(1));
  const remainingCapacity = Number(Math.max(0, maxCredits - totalWeightedLoad).toFixed(2));
  const excessLoad = Number(Math.max(0, totalWeightedLoad - maxCredits).toFixed(2));
  const deficitLoad = Number(Math.max(0, minCredits - totalWeightedLoad).toFixed(2));

  return {
    faculty: {
      id: faculty.id,
      faculty_code: faculty.faculty_code,
      full_name: faculty.full_name,
      email: faculty.email,
      designation: faculty.designation,
      employment_type: faculty.employment_type,
      specialization: faculty.specialization,
      is_visiting: faculty.employment_type === 'visiting',
      visiting_info: faculty.visiting_faculty || null,
    },
    workloadMetrics: {
      totalWeightedLoad,
      totalRawCredits,
      rawTheoryCredits,
      rawLabCredits,
      rawTheoryContactHours,
      rawLabContactHours,
      totalContactHours,
      preparationsCount,
      sectionsCount,
      totalAllocationsCount: allAllocations.length,
      weightsUsed: {
        theoryWeight,
        labWeight,
      },
    },
    policyLimits: {
      minCreditHours: minCredits,
      maxCreditHours: maxCredits,
      nearMaxThreshold,
      maxPreparations,
      maxContactHours,
      ruleSource: rule ? 'workload_rules_table' : 'faculty_profile_default',
    },
    status: {
      category: status, // 'Underloaded' | 'Balanced' | 'Near Maximum' | 'Overloaded'
      utilizationPercentage,
      remainingCapacity,
      excessLoad,
      deficitLoad,
      isCompliant: status !== 'Underloaded' && status !== 'Overloaded' && !preparationsExceeded,
      violations: [
        ...(status === 'Overloaded' ? [`Exceeds maximum allowable load by ${excessLoad} credit hours.`] : []),
        ...(status === 'Underloaded' ? [`Under minimum load requirement by ${deficitLoad} credit hours.`] : []),
        ...(preparationsExceeded ? [`Course preparations (${preparationsCount}) exceed policy limit of ${maxPreparations}.`] : []),
        ...(contactHoursExceeded ? [`Total contact hours (${totalContactHours}) exceed ceiling of ${maxContactHours} hrs/week.`] : []),
      ],
    },
    allocations: allAllocations,
  };
};

/**
 * Calculates department-wide workload overview for all active faculty members.
 */
const calculateDepartmentWorkloadSummary = async (sessionId, options = {}) => {
  const { data: facultyList, error: facErr } = await supabaseAdmin
    .from('faculty')
    .select('id')
    .eq('is_active', true);

  if (facErr) {
    throw new Error(`Failed to query faculty list: ${facErr.message}`);
  }

  const results = await Promise.all(
    (facultyList || []).map((f) =>
      calculateFacultyWorkload(f.id, sessionId, options).catch((err) => ({
        facultyId: f.id,
        error: err.message,
      }))
    )
  );

  // Group summary metrics
  let totalUnderloaded = 0;
  let totalBalanced = 0;
  let totalNearMax = 0;
  let totalOverloaded = 0;
  let totalViolations = 0;

  results.forEach((item) => {
    if (item.status) {
      if (item.status.category === 'Underloaded') totalUnderloaded++;
      else if (item.status.category === 'Balanced') totalBalanced++;
      else if (item.status.category === 'Near Maximum') totalNearMax++;
      else if (item.status.category === 'Overloaded') totalOverloaded++;

      if (!item.status.isCompliant) totalViolations++;
    }
  });

  return {
    sessionId,
    summaryCount: {
      totalFaculty: facultyList.length,
      underloaded: totalUnderloaded,
      balanced: totalBalanced,
      nearMaximum: totalNearMax,
      overloaded: totalOverloaded,
      nonCompliantCount: totalViolations,
    },
    facultyWorkloads: results,
  };
};

module.exports = {
  calculateFacultyWorkload,
  calculateDepartmentWorkloadSummary,
  DEFAULT_THEORY_WEIGHT,
  DEFAULT_LAB_WEIGHT,
};
