const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  calculateFacultyWorkload,
  calculateDepartmentWorkloadSummary,
  DEFAULT_THEORY_WEIGHT,
  DEFAULT_LAB_WEIGHT,
} = require('../utils/workloadEngine');

/**
 * Workload Engine Controller
 */

// 1. GET /api/v1/workload/faculty/:facultyId - Real-time Workload for Single Faculty
const getFacultyWorkload = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    let { session_id, session_code, theory_weight, lab_weight } = req.query;

    // If session_code is provided instead of session_id, resolve session_id
    if (!session_id && session_code) {
      const { data: session } = await supabaseAdmin
        .from('academic_sessions')
        .select('id')
        .eq('session_code', session_code)
        .maybeSingle();

      if (session) session_id = session.id;
    }

    // Default to current active session if not provided
    if (!session_id) {
      const { data: currentSession } = await supabaseAdmin
        .from('academic_sessions')
        .select('id, session_code')
        .eq('is_current', true)
        .maybeSingle();

      if (currentSession) {
        session_id = currentSession.id;
      } else {
        return errorResponse(res, 'session_id or active academic session is required.', null, 400);
      }
    }

    const tWeight = theory_weight !== undefined ? parseFloat(theory_weight) : DEFAULT_THEORY_WEIGHT;
    const lWeight = lab_weight !== undefined ? parseFloat(lab_weight) : DEFAULT_LAB_WEIGHT;

    const workloadData = await calculateFacultyWorkload(facultyId, session_id, {
      theoryWeight: tWeight,
      labWeight: lWeight,
    });

    return successResponse(res, 'Faculty workload calculated in real-time', workloadData);
  } catch (err) {
    if (err.message.includes('not found')) {
      return errorResponse(res, err.message, null, 404);
    }
    next(err);
  }
};

// 2. GET /api/v1/workload/summary - Department-wide Workload Matrix & Status Distribution
const getDepartmentWorkloadSummary = async (req, res, next) => {
  try {
    let { session_id, session_code, theory_weight, lab_weight } = req.query;

    if (!session_id && session_code) {
      const { data: session } = await supabaseAdmin
        .from('academic_sessions')
        .select('id')
        .eq('session_code', session_code)
        .maybeSingle();

      if (session) session_id = session.id;
    }

    if (!session_id) {
      const { data: currentSession } = await supabaseAdmin
        .from('academic_sessions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      if (currentSession) {
        session_id = currentSession.id;
      } else {
        return errorResponse(res, 'session_id or active academic session is required.', null, 400);
      }
    }

    const tWeight = theory_weight !== undefined ? parseFloat(theory_weight) : DEFAULT_THEORY_WEIGHT;
    const lWeight = lab_weight !== undefined ? parseFloat(lab_weight) : DEFAULT_LAB_WEIGHT;

    const summary = await calculateDepartmentWorkloadSummary(session_id, {
      theoryWeight: tWeight,
      labWeight: lWeight,
    });

    return successResponse(res, 'Department workload summary calculated', summary);
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/v1/workload/simulate - Simulate Course Assignment Impact
const simulateAllocationImpact = async (req, res, next) => {
  try {
    const {
      faculty_id,
      session_id,
      proposed_course_id,
      proposed_section_id,
      component_type = 'theory',
      credit_hours = 3.0,
      contact_hours = 3.0,
      theory_weight = DEFAULT_THEORY_WEIGHT,
      lab_weight = DEFAULT_LAB_WEIGHT,
    } = req.body;

    if (!faculty_id || !session_id || !proposed_course_id) {
      return errorResponse(
        res,
        'faculty_id, session_id, and proposed_course_id are required for simulation.',
        null,
        400
      );
    }

    // 1. Calculate Current Workload without simulation
    const currentWorkload = await calculateFacultyWorkload(faculty_id, session_id, {
      theoryWeight: parseFloat(theory_weight),
      labWeight: parseFloat(lab_weight),
    });

    // 2. Calculate Projected Workload with simulated allocation
    const simulatedAllocation = {
      id: 'simulated-temp-id',
      course_id: proposed_course_id,
      section_id: proposed_section_id || 'simulated-section',
      component_type,
      assigned_credit_hours: parseFloat(credit_hours),
      assigned_contact_hours: parseFloat(contact_hours),
      status: 'simulated',
    };

    const projectedWorkload = await calculateFacultyWorkload(faculty_id, session_id, {
      theoryWeight: parseFloat(theory_weight),
      labWeight: parseFloat(lab_weight),
      simulatedAllocations: [simulatedAllocation],
    });

    const deltaLoad = Number(
      (projectedWorkload.workloadMetrics.totalWeightedLoad - currentWorkload.workloadMetrics.totalWeightedLoad).toFixed(2)
    );

    return successResponse(res, 'Allocation impact simulation completed', {
      faculty: currentWorkload.faculty,
      comparison: {
        current: {
          totalWeightedLoad: currentWorkload.workloadMetrics.totalWeightedLoad,
          status: currentWorkload.status.category,
          utilizationPercentage: currentWorkload.status.utilizationPercentage,
          preparationsCount: currentWorkload.workloadMetrics.preparationsCount,
          isCompliant: currentWorkload.status.isCompliant,
        },
        projected: {
          totalWeightedLoad: projectedWorkload.workloadMetrics.totalWeightedLoad,
          deltaLoad,
          status: projectedWorkload.status.category,
          utilizationPercentage: projectedWorkload.status.utilizationPercentage,
          preparationsCount: projectedWorkload.workloadMetrics.preparationsCount,
          isCompliant: projectedWorkload.status.isCompliant,
          violations: projectedWorkload.status.violations,
        },
        willCauseOverload: projectedWorkload.status.category === 'Overloaded',
        willCausePreparationOverflow: projectedWorkload.status.violations.some((v) => v.includes('preparations')),
      },
      projectedDetails: projectedWorkload,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFacultyWorkload,
  getDepartmentWorkloadSummary,
  simulateAllocationImpact,
};
