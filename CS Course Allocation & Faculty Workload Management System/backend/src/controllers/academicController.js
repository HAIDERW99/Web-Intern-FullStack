const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');

/**
 * Academic Setup Controller (Sessions, Programmes, Semesters, Sections)
 */

// 1. Academic Sessions
const getSessions = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('academic_sessions')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) return errorResponse(res, error.message, null, 500);
    return successResponse(res, 'Academic sessions retrieved', data);
  } catch (err) {
    next(err);
  }
};

const createSession = async (req, res, next) => {
  try {
    const { session_code, name, start_date, end_date, is_current = false } = req.body;

    const { data, error } = await supabaseAdmin
      .from('academic_sessions')
      .insert({ session_code, name, start_date, end_date, is_current })
      .select()
      .single();

    if (error) return errorResponse(res, error.message, null, 400);

    await logActivity({
      userId: req.user.id,
      actionType: 'SESSION_CREATED',
      entityName: 'academic_sessions',
      entityId: data.id,
      newValues: data,
      req,
    });

    return successResponse(res, 'Academic session created', data, 201);
  } catch (err) {
    next(err);
  }
};

// 2. Programmes
const getProgrammes = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('programmes')
      .select('*')
      .order('code', { ascending: true });

    if (error) return errorResponse(res, error.message, null, 500);
    return successResponse(res, 'Programmes retrieved', data);
  } catch (err) {
    next(err);
  }
};

// 3. Semesters
const getSemesters = async (req, res, next) => {
  try {
    const { session_id, programme_id } = req.query;

    let query = supabaseAdmin
      .from('semesters')
      .select(`
        *,
        programmes (*),
        academic_sessions (*),
        sections (*)
      `)
      .order('semester_number', { ascending: true });

    if (session_id) query = query.eq('session_id', session_id);
    if (programme_id) query = query.eq('programme_id', programme_id);

    const { data, error } = await query;
    if (error) return errorResponse(res, error.message, null, 500);

    return successResponse(res, 'Semesters retrieved', data);
  } catch (err) {
    next(err);
  }
};

// 4. Sections
const getSections = async (req, res, next) => {
  try {
    const { semester_id } = req.query;

    let query = supabaseAdmin
      .from('sections')
      .select(`
        *,
        semesters (
          id,
          semester_number,
          programme_id,
          session_id,
          programmes (id, code, name),
          academic_sessions (id, session_code)
        )
      `)
      .order('name', { ascending: true });

    if (semester_id) query = query.eq('semester_id', semester_id);

    const { data, error } = await query;
    if (error) return errorResponse(res, error.message, null, 500);

    return successResponse(res, 'Sections retrieved', data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSessions,
  createSession,
  getProgrammes,
  getSemesters,
  getSections,
};
