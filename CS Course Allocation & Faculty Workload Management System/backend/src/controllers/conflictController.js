const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');
const { scanSessionConflicts } = require('../utils/conflictDetector');

/**
 * Conflicts & Violation Auditor Controller
 */

// 1. GET /api/v1/conflicts/scan - Live Scan for Conflicts in a Session
const scanConflicts = async (req, res, next) => {
  try {
    let { session_id, session_code, sync_db = false } = req.query;

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

      if (currentSession) session_id = currentSession.id;
      else return errorResponse(res, 'session_id or active academic session is required.', null, 400);
    }

    const scanResult = await scanSessionConflicts(session_id, {
      syncWithDatabase: sync_db === 'true' || sync_db === true,
      triggeredBy: req.user.id,
    });

    return successResponse(res, 'Session conflicts scan completed', scanResult);
  } catch (err) {
    next(err);
  }
};

// 2. POST /api/v1/conflicts/sync - Explicitly Run & Persist Conflicts into Database
const syncSessionConflicts = async (req, res, next) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return errorResponse(res, 'session_id is required for conflict synchronization.', null, 400);
    }

    const scanResult = await scanSessionConflicts(session_id, {
      syncWithDatabase: true,
      triggeredBy: req.user.id,
    });

    // Log Activity
    await logActivity({
      userId: req.user.id,
      actionType: 'CONFLICTS_SYNCED',
      entityName: 'conflicts',
      entityId: session_id,
      newValues: {
        totalIssues: scanResult.summary.totalIssuesFound,
        critical: scanResult.summary.critical,
        warnings: scanResult.summary.warnings,
      },
      req,
    });

    return successResponse(res, 'Conflicts successfully scanned and synchronized with database', scanResult);
  } catch (err) {
    next(err);
  }
};

// 3. GET /api/v1/conflicts - Query Persisted Conflicts from Database
const getConflicts = async (req, res, next) => {
  try {
    const { session_id, severity, is_resolved } = req.query;

    let query = supabaseAdmin
      .from('conflicts')
      .select(`
        *,
        academic_sessions (session_code, name),
        faculty (faculty_code, full_name, designation),
        course_allocations (
          component_type,
          courses (course_code, title),
          sections (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (session_id) query = query.eq('session_id', session_id);
    if (severity) query = query.eq('severity', severity);
    if (is_resolved !== undefined) query = query.eq('is_resolved', is_resolved === 'true');

    const { data, error } = await query;
    if (error) return errorResponse(res, error.message, null, 500);

    return successResponse(res, 'Conflicts retrieved from database', data);
  } catch (err) {
    next(err);
  }
};

// 4. PATCH /api/v1/conflicts/:id/resolve - Resolve Conflict
const resolveConflict = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('conflicts')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) return errorResponse(res, 'Conflict record not found', null, 404);

    const { data, error } = await supabaseAdmin
      .from('conflicts')
      .update({
        is_resolved: true,
        resolved_by: req.user.id,
        resolved_at: new Date().toISOString(),
        resolution_notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(res, error.message, null, 400);

    await logActivity({
      userId: req.user.id,
      actionType: 'CONFLICT_RESOLVED',
      entityName: 'conflicts',
      entityId: id,
      oldValues: existing,
      newValues: data,
      req,
    });

    return successResponse(res, 'Conflict marked as resolved', data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanConflicts,
  syncSessionConflicts,
  getConflicts,
  resolveConflict,
};
