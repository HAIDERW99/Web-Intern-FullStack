const { supabaseAdmin } = require('../config/supabase');
const { calculateFacultyWorkload } = require('./workloadEngine');

/**
 * Intelligent Faculty Course Recommendation Engine
 *
 * Evaluates and ranks faculty candidates for a given course assignment based on:
 * 1. Historical Teaching Experience (35%)
 * 2. Domain Expertise & Specialization Match (35%)
 * 3. Remaining Workload Capacity & Policy Limits (30%)
 */

// Default weights for recommendation dimensions
const DEFAULT_WEIGHTS = {
  experienceWeight: 0.35,
  domainWeight: 0.35,
  capacityWeight: 0.30,
};

/**
 * Extracts normalized keyword tokens from strings for semantic domain matching
 */
const tokenize = (text) => {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'intro', 'introduction', 'advanced', 'systems', 'concepts'].includes(w));
};

/**
 * Calculates keyword overlap between course metadata and faculty specialization
 */
const calculateDomainMatch = (course, faculty) => {
  const courseTokens = new Set([
    ...tokenize(course.title),
    ...tokenize(course.course_code),
    ...tokenize(course.department),
  ]);

  const specializationTokens = new Set();
  (faculty.specialization || []).forEach((spec) => {
    tokenize(spec).forEach((t) => specializationTokens.add(t));
  });

  if (courseTokens.size === 0 || specializationTokens.size === 0) {
    // Base department match score if no explicit specializations
    return faculty.department === course.department ? 50 : 20;
  }

  let matchingTokens = 0;
  courseTokens.forEach((token) => {
    if (specializationTokens.has(token)) {
      matchingTokens++;
    }
  });

  if (matchingTokens >= 2) return 100;
  if (matchingTokens === 1) return 85;

  // Fallback if same department
  if (faculty.department === course.department) return 55;
  return 25;
};

/**
 * Generates ranked faculty recommendations for a specific course allocation
 *
 * @param {Object} params
 * @param {string} params.courseId - UUID of the course to allocate
 * @param {string} params.sessionId - UUID of the target academic session
 * @param {string} [params.componentType='theory'] - 'theory' or 'lab'
 * @param {string} [params.sectionId] - Optional section ID for context
 * @param {Object} [params.customWeights] - Custom weights for scoring factors
 * @returns {Promise<Object>} Ranked faculty recommendations with scores and explanations
 */
const rankFacultyForCourse = async ({
  courseId,
  sessionId,
  componentType = 'theory',
  sectionId = null,
  customWeights = {},
}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  // 1. Fetch Target Course
  const { data: course, error: courseErr } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) {
    throw new Error(`Course not found with ID: ${courseId}`);
  }

  // 2. Fetch All Active Faculty
  const { data: facultyList, error: facErr } = await supabaseAdmin
    .from('faculty')
    .select(`
      *,
      visiting_faculty (*)
    `)
    .eq('is_active', true);

  if (facErr) {
    throw new Error(`Failed to fetch faculty directory: ${facErr.message}`);
  }

  // 3. Fetch Historical Allocations for this course to evaluate past teaching experience
  const { data: historicalAllocations } = await supabaseAdmin
    .from('course_allocations')
    .select('id, faculty_id, session_id, component_type, status')
    .eq('course_id', courseId)
    .neq('status', 'rejected');

  const courseHistoryMap = new Map();
  (historicalAllocations || []).forEach((alloc) => {
    const count = courseHistoryMap.get(alloc.faculty_id) || 0;
    courseHistoryMap.set(alloc.faculty_id, count + 1);
  });

  const courseCredits = componentType === 'lab'
    ? Number(course.lab_credit_hours || 1.0)
    : Number(course.theory_credit_hours || 3.0);

  // 4. Evaluate Each Faculty Candidate
  const rankedCandidates = await Promise.all(
    (facultyList || []).map(async (faculty) => {
      const pros = [];
      const cons = [];
      const warnings = [];

      // A. Calculate Current Workload
      let workload = null;
      try {
        workload = await calculateFacultyWorkload(faculty.id, sessionId);
      } catch (err) {
        // Fallback default
        workload = {
          workloadMetrics: { totalWeightedLoad: 0, preparationsCount: 0 },
          policyLimits: { minCreditHours: 6.0, maxCreditHours: 12.0, maxPreparations: 2 },
          status: { category: 'Underloaded' },
        };
      }

      const currentLoad = workload.workloadMetrics.totalWeightedLoad;
      const maxCredits = workload.policyLimits.maxCreditHours;
      const minCredits = workload.policyLimits.minCreditHours;
      const maxPreps = workload.policyLimits.maxPreparations;
      const currentPreps = workload.workloadMetrics.preparationsCount;

      // B. Experience Score (35%)
      const timesTaught = courseHistoryMap.get(faculty.id) || 0;
      let experienceScore = 0;
      if (timesTaught >= 3) {
        experienceScore = 100;
        pros.push(`Extensive experience: Taught ${course.course_code} ${timesTaught} times previously.`);
      } else if (timesTaught === 2) {
        experienceScore = 85;
        pros.push(`Taught ${course.course_code} 2 times previously.`);
      } else if (timesTaught === 1) {
        experienceScore = 70;
        pros.push(`Taught ${course.course_code} 1 time previously.`);
      } else {
        experienceScore = 15;
        cons.push(`First time teaching ${course.course_code}.`);
      }

      // C. Domain Expertise Score (35%)
      const domainScore = calculateDomainMatch(course, faculty);
      if (domainScore >= 85) {
        pros.push(`Strong specialization alignment with ${course.title}.`);
      } else if (domainScore >= 50) {
        pros.push(`Department domain match (${faculty.department}).`);
      } else {
        cons.push(`Outside primary specialization area.`);
      }

      // D. Capacity & Availability Score (30%)
      const projectedLoad = currentLoad + (componentType === 'lab' ? courseCredits * 0.5 : courseCredits * 1.0);
      let capacityScore = 0;

      if (projectedLoad > maxCredits) {
        capacityScore = 0;
        warnings.push(`Assigning this course would cause overload (${projectedLoad.toFixed(1)} / ${maxCredits} max credits).`);
      } else {
        const remainingCapacity = maxCredits - currentLoad;
        if (workload.status.category === 'Underloaded') {
          capacityScore = 100;
          pros.push(`High priority: Currently underloaded (${currentLoad.toFixed(1)} / ${minCredits} min required credits).`);
        } else if (workload.status.category === 'Balanced') {
          capacityScore = Math.max(50, Math.round((remainingCapacity / maxCredits) * 100));
          pros.push(`Available capacity: ${remainingCapacity.toFixed(1)} credit hours remaining.`);
        } else if (workload.status.category === 'Near Maximum') {
          capacityScore = 40;
          cons.push(`Near maximum workload limit.`);
        }
      }

      // Check Preparation limits
      if (currentPreps >= maxPreps && timesTaught === 0) {
        capacityScore = Math.max(0, capacityScore - 25);
        warnings.push(`Already at maximum distinct course preparations (${currentPreps}/${maxPreps}).`);
      }

      // E. Lab Component Suitability
      let labSuitability = true;
      if (componentType === 'lab') {
        const seniorTitles = ['Professor', 'Associate Professor'];
        if (seniorTitles.includes(faculty.designation)) {
          warnings.push(`Senior faculty (${faculty.designation}) is rarely assigned pure lab demonstrators.`);
          labSuitability = false;
        } else if (['Lab Engineer', 'Senior Lecturer', 'Lecturer'].includes(faculty.designation)) {
          pros.push(`Designation (${faculty.designation}) is well-suited for lab conduction.`);
        }
      }

      // F. Visiting Faculty Contract checks
      if (faculty.employment_type === 'visiting') {
        const visitingInfo = faculty.visiting_faculty?.[0];
        if (visitingInfo) {
          const maxCourses = visitingInfo.max_course_limit || 2;
          if (workload.workloadMetrics.totalAllocationsCount >= maxCourses) {
            capacityScore = 0;
            warnings.push(`Visiting contract limit reached (${maxCourses} courses max).`);
          }
        }
      }

      // Final Weighted Percentage Match (0 - 100%)
      const matchScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (experienceScore * weights.experienceWeight) +
            (domainScore * weights.domainWeight) +
            (capacityScore * weights.capacityWeight)
          )
        )
      );

      return {
        faculty: {
          id: faculty.id,
          faculty_code: faculty.faculty_code,
          full_name: faculty.full_name,
          designation: faculty.designation,
          employment_type: faculty.employment_type,
          specialization: faculty.specialization,
          department: faculty.department,
        },
        matchScore,
        scoringBreakdown: {
          experienceScore,
          domainScore,
          capacityScore,
          timesTaughtCourse: timesTaught,
          weightsApplied: weights,
        },
        currentWorkload: {
          currentLoad,
          maxCredits,
          minCredits,
          status: workload.status.category,
          utilizationPercentage: workload.status.utilizationPercentage,
        },
        evaluation: {
          pros,
          cons,
          warnings,
          labSuitability,
          isRecommended: matchScore >= 60 && warnings.length === 0,
        },
      };
    })
  );

  // 5. Sort by Match Score Descending
  rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);

  // Assign Ordinal Rank
  const rankedWithPositions = rankedCandidates.map((candidate, idx) => ({
    rank: idx + 1,
    ...candidate,
  }));

  return {
    course: {
      id: course.id,
      course_code: course.course_code,
      title: course.title,
      department: course.department,
      componentType,
      allocatedCredits: courseCredits,
    },
    sessionId,
    totalEvaluatedFaculty: rankedCandidates.length,
    recommendations: rankedWithPositions,
  };
};

module.exports = {
  rankFacultyForCourse,
};
