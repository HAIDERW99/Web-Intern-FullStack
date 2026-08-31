const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');
const { parseCreditString, CreditParseError } = require('../utils/creditParser');

/**
 * Course Management Controller with Credit Parsing Support
 */

// 1. GET /api/v1/courses - Get all courses with filters and search
const getCourses = async (req, res, next) => {
  try {
    const { department, course_type, is_active, search } = req.query;

    let query = supabaseAdmin
      .from('courses')
      .select('*')
      .order('course_code', { ascending: true });

    if (department) query = query.eq('department', department);
    if (course_type) query = query.eq('course_type', course_type);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) {
      query = query.or(`course_code.ilike.%${search}%,title.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) return errorResponse(res, error.message, null, 500);

    // Append formatted credit string to each course in the response
    const enrichedData = (data || []).map((c) => ({
      ...c,
      credit_string: `${(Number(c.theory_credit_hours) + Number(c.lab_credit_hours)).toFixed(0)}(${Number(c.theory_credit_hours).toFixed(0)},${Number(c.lab_credit_hours).toFixed(0)})`,
    }));

    return successResponse(res, 'Courses retrieved successfully', enrichedData);
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/v1/courses/:id - Single Course Details + Prerequisites + Offerings
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        course_offerings (
          id,
          session_id,
          programme_id,
          semester_number,
          expected_sections,
          is_offered,
          academic_sessions (session_code, name),
          programmes (code, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !course) {
      return errorResponse(res, 'Course not found', null, 404);
    }

    const creditString = `${(Number(course.theory_credit_hours) + Number(course.lab_credit_hours)).toFixed(0)}(${Number(course.theory_credit_hours).toFixed(0)},${Number(course.lab_credit_hours).toFixed(0)})`;

    return successResponse(res, 'Course details loaded', {
      ...course,
      credit_string: creditString,
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/v1/courses - Create Course (Accepts credit_string e.g. "3(2,1)" or explicit fields)
const createCourse = async (req, res, next) => {
  try {
    const {
      course_code,
      title,
      department = 'Computer Science',
      credit_string, // e.g., "3(2,1)" or "4(3,1)"
      theory_credit_hours,
      lab_credit_hours,
      theory_contact_hours,
      lab_contact_hours,
      course_type,
      recommended_semester = 1,
      is_elective = false,
      prerequisite_course_codes = [],
    } = req.body;

    if (!course_code || !title) {
      return errorResponse(res, 'course_code and title are required.', null, 400);
    }

    // Determine and parse credit structure
    let parsedCredits;
    try {
      if (credit_string) {
        parsedCredits = parseCreditString(credit_string);
      } else if (theory_credit_hours !== undefined || lab_credit_hours !== undefined) {
        parsedCredits = parseCreditString({
          theoryCredits: theory_credit_hours,
          labCredits: lab_credit_hours || 0,
        });
      } else {
        // Default 3(3,0)
        parsedCredits = parseCreditString('3(3,0)');
      }
    } catch (parseErr) {
      return errorResponse(res, parseErr.message, parseErr.details, 400);
    }

    const determinedCourseType = course_type || parsedCredits.courseType;
    const finalTheoryContact = theory_contact_hours !== undefined ? theory_contact_hours : parsedCredits.theoryContactHours;
    const finalLabContact = lab_contact_hours !== undefined ? lab_contact_hours : parsedCredits.labContactHours;

    const { data: newCourse, error } = await supabaseAdmin
      .from('courses')
      .insert({
        course_code: course_code.toUpperCase().trim(),
        title: title.trim(),
        department,
        theory_credit_hours: parsedCredits.theoryCredits,
        lab_credit_hours: parsedCredits.labCredits,
        theory_contact_hours: finalTheoryContact,
        lab_contact_hours: finalLabContact,
        course_type: determinedCourseType,
        recommended_semester,
        is_elective,
        prerequisite_course_codes: Array.isArray(prerequisite_course_codes) ? prerequisite_course_codes : [],
      })
      .select()
      .single();

    if (error) {
      return errorResponse(res, 'Failed to create course: ' + error.message, null, 400);
    }

    // Log Activity
    await logActivity({
      userId: req.user.id,
      actionType: 'COURSE_CREATED',
      entityName: 'courses',
      entityId: newCourse.id,
      newValues: newCourse,
      req,
    });

    return successResponse(
      res,
      'Course created successfully',
      {
        ...newCourse,
        credit_string: parsedCredits.formattedString,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

// 4. PUT /api/v1/courses/:id - Update Course
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      course_code,
      title,
      department,
      credit_string,
      theory_credit_hours,
      lab_credit_hours,
      theory_contact_hours,
      lab_contact_hours,
      course_type,
      recommended_semester,
      is_elective,
      prerequisite_course_codes,
      is_active,
    } = req.body;

    const { data: existingCourse, error: fetchErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existingCourse) {
      return errorResponse(res, 'Course not found', null, 404);
    }

    const updates = {};
    if (course_code !== undefined) updates.course_code = course_code.toUpperCase().trim();
    if (title !== undefined) updates.title = title.trim();
    if (department !== undefined) updates.department = department;
    if (recommended_semester !== undefined) updates.recommended_semester = recommended_semester;
    if (is_elective !== undefined) updates.is_elective = is_elective;
    if (prerequisite_course_codes !== undefined) {
      updates.prerequisite_course_codes = Array.isArray(prerequisite_course_codes)
        ? prerequisite_course_codes
        : [prerequisite_course_codes];
    }
    if (is_active !== undefined) updates.is_active = is_active;

    // Handle credit updates
    if (credit_string) {
      try {
        const parsed = parseCreditString(credit_string);
        updates.theory_credit_hours = parsed.theoryCredits;
        updates.lab_credit_hours = parsed.labCredits;
        updates.theory_contact_hours = parsed.theoryContactHours;
        updates.lab_contact_hours = parsed.labContactHours;
        if (!course_type) updates.course_type = parsed.courseType;
      } catch (parseErr) {
        return errorResponse(res, parseErr.message, parseErr.details, 400);
      }
    } else {
      if (theory_credit_hours !== undefined) updates.theory_credit_hours = theory_credit_hours;
      if (lab_credit_hours !== undefined) updates.lab_credit_hours = lab_credit_hours;
      if (theory_contact_hours !== undefined) updates.theory_contact_hours = theory_contact_hours;
      if (lab_contact_hours !== undefined) updates.lab_contact_hours = lab_contact_hours;
    }

    if (course_type !== undefined) updates.course_type = course_type;

    const { data: updatedCourse, error: updateErr } = await supabaseAdmin
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return errorResponse(res, 'Failed to update course: ' + updateErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'COURSE_UPDATED',
      entityName: 'courses',
      entityId: id,
      oldValues: existingCourse,
      newValues: updatedCourse,
      req,
    });

    const formattedCredits = `${(Number(updatedCourse.theory_credit_hours) + Number(updatedCourse.lab_credit_hours)).toFixed(0)}(${Number(updatedCourse.theory_credit_hours).toFixed(0)},${Number(updatedCourse.lab_credit_hours).toFixed(0)})`;

    return successResponse(res, 'Course updated successfully', {
      ...updatedCourse,
      credit_string: formattedCredits,
    });
  } catch (err) {
    next(err);
  }
};

// 5. DELETE /api/v1/courses/:id - Delete Course
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existingCourse } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCourse) {
      return errorResponse(res, 'Course not found', null, 404);
    }

    // Check if course is part of active offerings or allocations
    const { count: allocCount } = await supabaseAdmin
      .from('course_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', id);

    if (allocCount && allocCount > 0) {
      return errorResponse(
        res,
        `Cannot delete course '${existingCourse.course_code}': It is currently referenced in ${allocCount} course allocation(s).`,
        null,
        409
      );
    }

    const { error: delErr } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);

    if (delErr) {
      return errorResponse(res, 'Failed to delete course: ' + delErr.message, null, 400);
    }

    await logActivity({
      userId: req.user.id,
      actionType: 'COURSE_DELETED',
      entityName: 'courses',
      entityId: id,
      oldValues: existingCourse,
      req,
    });

    return successResponse(res, 'Course deleted successfully', { id });
  } catch (err) {
    next(err);
  }
};

// 6. POST /api/v1/courses/parse-credits - Utility test endpoint
const testParseCredits = async (req, res, next) => {
  try {
    const { credit_string, lab_contact_ratio, theory_contact_ratio } = req.body;

    if (!credit_string) {
      return errorResponse(res, 'credit_string is required (e.g., "3(2,1)" or "4(3,1)").', null, 400);
    }

    const result = parseCreditString(credit_string, {
      labContactHourRatio: lab_contact_ratio ? Number(lab_contact_ratio) : 3.0,
      theoryContactHourRatio: theory_contact_ratio ? Number(theory_contact_ratio) : 1.0,
    });

    return successResponse(res, 'Credit string successfully parsed', result);
  } catch (err) {
    if (err instanceof CreditParseError) {
      return errorResponse(res, err.message, err.details, 400);
    }
    next(err);
  }
};

// 7. GET /api/v1/courses/offerings - Get Course Offerings
const getOfferings = async (req, res, next) => {
  try {
    const { session_id, programme_id } = req.query;

    let query = supabaseAdmin
      .from('course_offerings')
      .select(`
        *,
        courses (*),
        academic_sessions (session_code, name),
        programmes (code, name)
      `)
      .order('semester_number', { ascending: true });

    if (session_id) query = query.eq('session_id', session_id);
    if (programme_id) query = query.eq('programme_id', programme_id);

    const { data, error } = await query;
    if (error) return errorResponse(res, error.message, null, 500);

    return successResponse(res, 'Course offerings retrieved', data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  testParseCredits,
  getOfferings,
};
