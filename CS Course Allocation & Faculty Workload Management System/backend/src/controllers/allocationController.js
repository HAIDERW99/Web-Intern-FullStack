const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');

/**
 * Course Allocation Controller with Approval Pipeline & Record Locking
 */

// 1. GET /api/v1/allocations - Query allocations with filters
const getAllocations = async (req, res, next) => {
  try {
    const { session_id, programme_id, semester_id, section_id, faculty_id, status } = req.query;

    let query = supabaseAdmin
      .from('course_allocations')
      .select(`
        id,
        session_id,
        course_offering_id,
        course_id,
        section_id,
        faculty_id,
        component_type,
        assigned_credit_hours,
        assigned_contact_hours,
        status,
        remarks,
        allocated_at,
        courses (id, course_code, title, theory_credit_hours, lab_credit_hours),
        faculty (id, faculty_code, full_name, designation, employment_type),
        sections (id, name, student_count, shift, semesters (id, semester_number, programmes (id, code, name))),
        academic_sessions (id, session_code, name, is_locked)
      `)
      .order('allocated_at', { ascending: false });

    if (session_id) query = query.eq('session_id', session_id);
    if (section_id) query = query.eq('section_id', section_id);
    if (faculty_id) query = query.eq('faculty_id', faculty_id);
    if (status) query = query.eq('status', status);

    const { data: allocations, error } = await query;

    if (error) {
      return errorResponse(res, 'Failed to fetch allocations: ' + error.message, null, 500);
    }

    return successResponse(res, 'Allocations retrieved successfully', allocations);
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/v1/allocations/:id - Single Allocation
const getAllocationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: allocation, error } = await supabaseAdmin
      .from('course_allocations')
      .select(`
        *,
        courses (*),
        faculty (*),
        sections (*, semesters (*, programmes (*))),
        academic_sessions (*)
      `)
      .eq('id', id)
      .single();

    if (error || !allocation) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    return successResponse(res, 'Allocation retrieved successfully', allocation);
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/v1/allocations - Create / Draft Course Allocation
const createAllocation = async (req, res, next) => {
  try {
    const {
      session_id,
      course_offering_id,
      course_id,
      section_id,
      faculty_id,
      component_type,
      assigned_credit_hours,
      assigned_contact_hours,
      status = 'draft',
      remarks,
    } = req.body;

    if (!session_id || !course_id || !section_id || !faculty_id || !component_type) {
      return errorResponse(res, 'Missing required allocation parameters (session_id, course_id, section_id, faculty_id, component_type).', null, 400);
    }

    // Verify session lock status
    const { data: sessionData } = await supabaseAdmin
      .from('academic_sessions')
      .select('is_locked')
      .eq('id', session_id)
      .single();

    if (sessionData?.is_locked) {
      return errorResponse(res, 'Cannot create allocations: This academic session is locked.', null, 400);
    }

    // Insert allocation
    const { data: newAllocation, error: insertErr } = await supabaseAdmin
      .from('course_allocations')
      .insert({
        session_id,
        course_offering_id,
        course_id,
        section_id,
        faculty_id,
        component_type,
        assigned_credit_hours: assigned_credit_hours || 3.0,
        assigned_contact_hours: assigned_contact_hours || 3.0,
        status,
        allocated_by: req.user.id,
        remarks,
      })
      .select(`
        *,
        courses (course_code, title),
        faculty (full_name),
        sections (name)
      `)
      .single();

    if (insertErr) {
      return errorResponse(res, 'Failed to create allocation: ' + insertErr.message, null, 400);
    }

    // Activity Log
    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_CREATED',
      entityName: 'course_allocations',
      entityId: newAllocation.id,
      newValues: newAllocation,
      req,
    });

    return successResponse(res, 'Course allocation drafted successfully', newAllocation, 201);
  } catch (err) {
    next(err);
  }
};

// 4. PUT /api/v1/allocations/:id - Update Course Allocation (Locked for Team Members if Approved)
const updateAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      faculty_id,
      component_type,
      assigned_credit_hours,
      assigned_contact_hours,
      status,
      remarks,
    } = req.body;

    // Fetch existing allocation
    const { data: oldAllocation, error: fetchErr } = await supabaseAdmin
      .from('course_allocations')
      .select('*, academic_sessions (is_locked)')
      .eq('id', id)
      .single();

    if (fetchErr || !oldAllocation) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    if (oldAllocation.academic_sessions?.is_locked) {
      return errorResponse(res, 'Cannot modify allocation: Academic session is locked.', null, 403);
    }

    // 🔒 RECORD LOCKING: If allocation is Approved or Published, Team Members cannot modify it
    const isHODorAdmin = ['hod', 'dean', 'admin'].includes(req.user.role);
    if (['approved', 'published'].includes(oldAllocation.status) && !isHODorAdmin) {
      return errorResponse(
        res,
        `Allocation record is '${oldAllocation.status}' by HOD and locked against team member edits. Request HOD to unlock or re-draft.`,
        { allocationId: id, currentStatus: oldAllocation.status },
        403
      );
    }

    const updates = {};
    if (faculty_id !== undefined) updates.faculty_id = faculty_id;
    if (component_type !== undefined) updates.component_type = component_type;
    if (assigned_credit_hours !== undefined) updates.assigned_credit_hours = assigned_credit_hours;
    if (assigned_contact_hours !== undefined) updates.assigned_contact_hours = assigned_contact_hours;
    if (status !== undefined) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;

    const { data: updatedAllocation, error: updateErr } = await supabaseAdmin
      .from('course_allocations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return errorResponse(res, 'Failed to update allocation: ' + updateErr.message, null, 400);
    }

    // Activity Log
    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_UPDATED',
      entityName: 'course_allocations',
      entityId: id,
      oldValues: oldAllocation,
      newValues: updatedAllocation,
      req,
    });

    return successResponse(res, 'Course allocation updated successfully', updatedAllocation);
  } catch (err) {
    next(err);
  }
};

// 5. PATCH /api/v1/allocations/:id/submit - Submit for HOD Review (Team Member -> Under Review)
const submitForReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('course_allocations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    if (existing.status === 'approved') {
      return errorResponse(res, 'This allocation has already been approved by the HOD.', null, 400);
    }

    const { data: submitted, error: submitErr } = await supabaseAdmin
      .from('course_allocations')
      .update({
        status: 'under_review',
        remarks: remarks || existing.remarks,
      })
      .eq('id', id)
      .select()
      .single();

    if (submitErr) {
      return errorResponse(res, 'Failed to submit allocation for review: ' + submitErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_SUBMITTED_FOR_REVIEW',
      entityName: 'course_allocations',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: submitted.status },
      req,
    });

    return successResponse(res, 'Allocation submitted for HOD review', submitted);
  } catch (err) {
    next(err);
  }
};

// 6. PATCH /api/v1/allocations/:id/approve - Final HOD Approval (Locks the Record)
const approveAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('course_allocations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    const { data: approved, error: approveErr } = await supabaseAdmin
      .from('course_allocations')
      .update({
        status: 'approved',
        approved_by: req.user.id,
        remarks: remarks || existing.remarks,
      })
      .eq('id', id)
      .select()
      .single();

    if (approveErr) {
      return errorResponse(res, 'Failed to approve allocation: ' + approveErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_APPROVED',
      entityName: 'course_allocations',
      entityId: id,
      oldValues: { status: existing.status, approved_by: existing.approved_by },
      newValues: { status: approved.status, approved_by: approved.approved_by },
      req,
    });

    return successResponse(res, 'Allocation approved by HOD and locked for team member edits', approved);
  } catch (err) {
    next(err);
  }
};

// 7. PATCH /api/v1/allocations/:id/reject - HOD Rejection
const rejectAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return errorResponse(res, 'rejection_reason is required when rejecting an allocation.', null, 400);
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('course_allocations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    const { data: rejected, error: rejectErr } = await supabaseAdmin
      .from('course_allocations')
      .update({
        status: 'rejected',
        remarks: `[REJECTED by HOD]: ${rejection_reason}`,
      })
      .eq('id', id)
      .select()
      .single();

    if (rejectErr) {
      return errorResponse(res, 'Failed to reject allocation: ' + rejectErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_REJECTED',
      entityName: 'course_allocations',
      entityId: id,
      oldValues: { status: existing.status, remarks: existing.remarks },
      newValues: { status: rejected.status, remarks: rejected.remarks },
      req,
    });

    return successResponse(res, 'Allocation rejected by HOD', rejected);
  } catch (err) {
    next(err);
  }
};

// 8. POST /api/v1/allocations/bulk-status - Batch Update Status (e.g. submit all or approve all)
const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { allocation_ids, target_status, remarks } = req.body;

    if (!Array.isArray(allocation_ids) || allocation_ids.length === 0 || !target_status) {
      return errorResponse(res, 'allocation_ids array and target_status are required.', null, 400);
    }

    const isHODorAdmin = ['hod', 'dean', 'admin'].includes(req.user.role);

    // If setting to approved/rejected/published, require HOD role
    if (['approved', 'rejected', 'published'].includes(target_status) && !isHODorAdmin) {
      return errorResponse(res, `Only HOD or Admin can bulk set status to '${target_status}'.`, null, 403);
    }

    const updates = {
      status: target_status,
      ...(target_status === 'approved' && { approved_by: req.user.id }),
      ...(remarks && { remarks }),
    };

    const { data: updatedList, error: bulkErr } = await supabaseAdmin
      .from('course_allocations')
      .update(updates)
      .in('id', allocation_ids)
      .select();

    if (bulkErr) {
      return errorResponse(res, 'Failed to bulk update allocations: ' + bulkErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATIONS_BULK_STATUS_UPDATED',
      entityName: 'course_allocations',
      newValues: { targetStatus: target_status, count: updatedList.length },
      req,
    });

    return successResponse(res, `Successfully updated ${updatedList.length} allocations to '${target_status}'`, updatedList);
  } catch (err) {
    next(err);
  }
};

// 9. DELETE /api/v1/allocations/:id - Delete Allocation (Protected by Record Locking)
const deleteAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('course_allocations')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(res, 'Allocation not found', null, 404);
    }

    // 🔒 RECORD LOCKING: If Approved, Team Members cannot delete
    const isHODorAdmin = ['hod', 'dean', 'admin'].includes(req.user.role);
    if (['approved', 'published'].includes(existing.status) && !isHODorAdmin) {
      return errorResponse(
        res,
        `Cannot delete: Allocation is '${existing.status}' by HOD and locked for team members.`,
        null,
        403
      );
    }

    const { error: delErr } = await supabaseAdmin
      .from('course_allocations')
      .delete()
      .eq('id', id);

    if (delErr) {
      return errorResponse(res, 'Failed to delete allocation: ' + delErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'ALLOCATION_DELETED',
      entityName: 'course_allocations',
      entityId: id,
      oldValues: existing,
      req,
    });

    return successResponse(res, 'Allocation deleted successfully', { id });
  } catch (err) {
    next(err);
  }
};

// 10. GET /api/v1/allocations/grid - View Grid
const getSectionGrid = async (req, res, next) => {
  try {
    const { session_code, programme_code } = req.query;

    let query = supabaseAdmin.from('view_section_allocation_grid').select('*');
    if (session_code) query = query.eq('session_code', session_code);
    if (programme_code) query = query.eq('programme_code', programme_code);

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Failed to fetch allocation grid: ' + error.message, null, 500);
    }

    return successResponse(res, 'Allocation grid loaded', data);
  } catch (err) {
    next(err);
  }
};

// 11. GET /api/v1/allocations/:id/history - Audit History
const getAllocationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: history, error } = await supabaseAdmin
      .from('allocation_history')
      .select(`
        *,
        previous_faculty:previous_faculty_id (faculty_code, full_name),
        new_faculty:new_faculty_id (faculty_code, full_name),
        changed_by_user:changed_by (email)
      `)
      .eq('allocation_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(res, 'Failed to fetch allocation history', null, 500);
    }

    return successResponse(res, 'Allocation history loaded', history);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  submitForReview,
  approveAllocation,
  rejectAllocation,
  bulkUpdateStatus,
  deleteAllocation,
  getSectionGrid,
  getAllocationHistory,
};
