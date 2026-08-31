const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');
const { calculateFacultyWorkload } = require('../utils/workloadEngine');

/**
 * Faculty Management Controller (Permanent & Visiting Faculty)
 */

// 1. GET /api/v1/faculty - Get all faculty with optional filters & search
const getFacultyList = async (req, res, next) => {
  try {
    const { designation, employment_type, is_active, search } = req.query;

    let query = supabaseAdmin
      .from('faculty')
      .select(`
        *,
        visiting_faculty (*)
      `)
      .order('full_name', { ascending: true });

    if (designation) query = query.eq('designation', designation);
    if (employment_type) query = query.eq('employment_type', employment_type);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,faculty_code.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Failed to fetch faculty directory: ' + error.message, null, 500);
    }

    return successResponse(res, 'Faculty directory loaded', data);
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/v1/faculty/:id - Single Faculty details + Allocations + Visiting data
const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { session_id } = req.query;

    const { data: faculty, error } = await supabaseAdmin
      .from('faculty')
      .select(`
        *,
        visiting_faculty (*),
        course_allocations (
          id,
          session_id,
          component_type,
          assigned_credit_hours,
          assigned_contact_hours,
          status,
          remarks,
          courses (id, course_code, title, theory_credit_hours, lab_credit_hours),
          sections (id, name, student_count, shift, semesters (semester_number, programmes (code, name))),
          academic_sessions (id, session_code, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !faculty) {
      return errorResponse(res, 'Faculty member not found', null, 404);
    }

    // If session_id is provided, compute real-time workload
    let calculatedWorkload = null;
    if (session_id) {
      try {
        calculatedWorkload = await calculateFacultyWorkload(id, session_id);
      } catch (wErr) {
        console.warn('[Workload Calculation Warning]:', wErr.message);
      }
    }

    return successResponse(res, 'Faculty details loaded', {
      ...faculty,
      realtimeWorkload: calculatedWorkload,
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/v1/faculty - Create Faculty (Permanent or Visiting)
const createFaculty = async (req, res, next) => {
  try {
    const {
      faculty_code,
      full_name,
      email,
      phone,
      department = 'Computer Science',
      designation,
      employment_type = 'full_time',
      specialization = [],
      min_credit_hours,
      max_credit_hours,
      max_preparations = 2,
      // Visiting Faculty specific fields
      primary_institution,
      highest_degree,
      contract_start_date,
      contract_end_date,
      hourly_remuneration = 0,
      max_course_limit = 2,
    } = req.body;

    if (!faculty_code || !full_name || !email || !designation) {
      return errorResponse(res, 'faculty_code, full_name, email, and designation are required.', null, 400);
    }

    // Default min/max load based on employment type if not provided
    const isVisiting = employment_type === 'visiting';
    const minHours = min_credit_hours !== undefined ? min_credit_hours : (isVisiting ? 3.0 : 6.0);
    const maxHours = max_credit_hours !== undefined ? max_credit_hours : (isVisiting ? 6.0 : 12.0);

    // 1. Insert Base Faculty Record
    const { data: newFaculty, error: facErr } = await supabaseAdmin
      .from('faculty')
      .insert({
        faculty_code: faculty_code.toUpperCase().trim(),
        full_name,
        email: email.toLowerCase().trim(),
        phone,
        department,
        designation,
        employment_type,
        specialization: Array.isArray(specialization) ? specialization : [specialization],
        min_credit_hours: minHours,
        max_credit_hours: maxHours,
        max_preparations,
      })
      .select()
      .single();

    if (facErr) {
      return errorResponse(res, 'Failed to create faculty: ' + facErr.message, null, 400);
    }

    let visitingRecord = null;

    // 2. If Visiting, Insert Extended Visiting Faculty Details
    if (isVisiting) {
      if (!primary_institution || !highest_degree || !contract_start_date || !contract_end_date) {
        // Rollback created faculty
        await supabaseAdmin.from('faculty').delete().eq('id', newFaculty.id);
        return errorResponse(
          res,
          'Visiting faculty requires primary_institution, highest_degree, contract_start_date, and contract_end_date.',
          null,
          400
        );
      }

      const { data: vData, error: vErr } = await supabaseAdmin
        .from('visiting_faculty')
        .insert({
          faculty_id: newFaculty.id,
          primary_institution,
          highest_degree,
          contract_start_date,
          contract_end_date,
          hourly_remuneration,
          max_course_limit,
          approved_by: req.user.id,
        })
        .select()
        .single();

      if (vErr) {
        await supabaseAdmin.from('faculty').delete().eq('id', newFaculty.id);
        return errorResponse(res, 'Failed to save visiting faculty metadata: ' + vErr.message, null, 400);
      }
      visitingRecord = vData;
    }

    const fullResult = {
      ...newFaculty,
      visiting_faculty: visitingRecord ? [visitingRecord] : [],
    };

    // Log Activity
    await logActivity({
      userId: req.user.id,
      actionType: 'FACULTY_CREATED',
      entityName: 'faculty',
      entityId: newFaculty.id,
      newValues: fullResult,
      req,
    });

    return successResponse(res, 'Faculty member created successfully', fullResult, 201);
  } catch (err) {
    next(err);
  }
};

// 4. PUT /api/v1/faculty/:id - Update Faculty & Visiting Details
const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      department,
      designation,
      employment_type,
      specialization,
      min_credit_hours,
      max_credit_hours,
      max_preparations,
      is_active,
      // Visiting updates
      primary_institution,
      highest_degree,
      contract_start_date,
      contract_end_date,
      hourly_remuneration,
      max_course_limit,
    } = req.body;

    // Fetch existing faculty
    const { data: existingFaculty, error: fetchErr } = await supabaseAdmin
      .from('faculty')
      .select('*, visiting_faculty (*)')
      .eq('id', id)
      .single();

    if (fetchErr || !existingFaculty) {
      return errorResponse(res, 'Faculty member not found', null, 404);
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (designation !== undefined) updates.designation = designation;
    if (employment_type !== undefined) updates.employment_type = employment_type;
    if (specialization !== undefined) {
      updates.specialization = Array.isArray(specialization) ? specialization : [specialization];
    }
    if (min_credit_hours !== undefined) updates.min_credit_hours = min_credit_hours;
    if (max_credit_hours !== undefined) updates.max_credit_hours = max_credit_hours;
    if (max_preparations !== undefined) updates.max_preparations = max_preparations;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: updatedFaculty, error: updateErr } = await supabaseAdmin
      .from('faculty')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return errorResponse(res, 'Failed to update faculty: ' + updateErr.message, null, 400);
    }

    // Handle Visiting Faculty update or upsert
    let updatedVisiting = null;
    const targetEmploymentType = employment_type || existingFaculty.employment_type;

    if (targetEmploymentType === 'visiting') {
      const vUpdates = {};
      if (primary_institution !== undefined) vUpdates.primary_institution = primary_institution;
      if (highest_degree !== undefined) vUpdates.highest_degree = highest_degree;
      if (contract_start_date !== undefined) vUpdates.contract_start_date = contract_start_date;
      if (contract_end_date !== undefined) vUpdates.contract_end_date = contract_end_date;
      if (hourly_remuneration !== undefined) vUpdates.hourly_remuneration = hourly_remuneration;
      if (max_course_limit !== undefined) vUpdates.max_course_limit = max_course_limit;

      if (Object.keys(vUpdates).length > 0) {
        const { data: vData, error: vErr } = await supabaseAdmin
          .from('visiting_faculty')
          .upsert({
            faculty_id: id,
            ...vUpdates,
          })
          .select()
          .single();

        if (!vErr) updatedVisiting = vData;
      }
    }

    const finalResult = {
      ...updatedFaculty,
      visiting_faculty: updatedVisiting
        ? [updatedVisiting]
        : existingFaculty.visiting_faculty,
    };

    // Log Activity
    await logActivity({
      userId: req.user.id,
      actionType: 'FACULTY_UPDATED',
      entityName: 'faculty',
      entityId: id,
      oldValues: existingFaculty,
      newValues: finalResult,
      req,
    });

    return successResponse(res, 'Faculty updated successfully', finalResult);
  } catch (err) {
    next(err);
  }
};

// 5. DELETE /api/v1/faculty/:id - Delete / Deactivate Faculty
const deleteFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    const { data: existingFaculty } = await supabaseAdmin
      .from('faculty')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingFaculty) {
      return errorResponse(res, 'Faculty member not found', null, 404);
    }

    // Check if active course allocations exist
    const { count, error: countErr } = await supabaseAdmin
      .from('course_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('faculty_id', id);

    if (count && count > 0) {
      // If allocations exist, prefer deactivating unless explicitly forcing
      if (!permanent) {
        const { data: deactivated } = await supabaseAdmin
          .from('faculty')
          .update({ is_active: false })
          .eq('id', id)
          .select()
          .single();

        await logActivity({
          userId: req.user.id,
          actionType: 'FACULTY_DEACTIVATED',
          entityName: 'faculty',
          entityId: id,
          oldValues: existingFaculty,
          newValues: deactivated,
          req,
        });

        return successResponse(
          res,
          'Faculty has active course allocations and was deactivated instead of permanently deleted.',
          deactivated
        );
      } else {
        return errorResponse(
          res,
          `Cannot delete faculty: ${count} course allocations are linked to this record. Reassign or remove allocations first.`,
          null,
          409
        );
      }
    }

    // Hard delete
    const { error: delErr } = await supabaseAdmin
      .from('faculty')
      .delete()
      .eq('id', id);

    if (delErr) {
      return errorResponse(res, 'Failed to delete faculty: ' + delErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'FACULTY_DELETED',
      entityName: 'faculty',
      entityId: id,
      oldValues: existingFaculty,
      req,
    });

    return successResponse(res, 'Faculty deleted successfully', { id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFacultyList,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};
