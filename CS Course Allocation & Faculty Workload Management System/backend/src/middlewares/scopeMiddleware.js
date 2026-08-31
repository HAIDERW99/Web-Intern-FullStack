const { supabaseAdmin } = require('../config/supabase');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Granular Scope Access Control Middleware
 *
 * Verifies if the authenticated user has appropriate scope permissions
 * (Programme -> Semester -> Section) before allowing CRUD operations.
 *
 * @param {Object} options
 * @param {'read'|'write'|'approve'} [options.action='write'] - The type of permission required
 */
const requireScopeAccess = (options = { action: 'write' }) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', null, 401);
      }

      // 1. Full Departmental Roles (HOD, Dean, Admin) bypass granular scope checks
      const globalRoles = ['admin', 'dean', 'hod'];
      if (globalRoles.includes(req.user.role)) {
        return next();
      }

      // 2. Extract Scope Parameters from params, body, or query
      let programmeId = req.params.programmeId || req.body.programme_id || req.body.programmeId || req.query.programmeId;
      let semesterId = req.params.semesterId || req.body.semester_id || req.body.semesterId || req.query.semesterId;
      let sectionId = req.params.sectionId || req.body.section_id || req.body.sectionId || req.query.sectionId;
      const allocationId = req.params.allocationId || req.params.id;

      // If allocationId is provided but scope IDs are missing, resolve from database
      if (allocationId && (!sectionId || !semesterId || !programmeId)) {
        const { data: allocation, error: allocErr } = await supabaseAdmin
          .from('course_allocations')
          .select(`
            id,
            section_id,
            sections:section_id (
              id,
              semester_id,
              semesters:semester_id (
                id,
                programme_id
              )
            )
          `)
          .eq('id', allocationId)
          .single();

        if (!allocErr && allocation?.sections) {
          sectionId = allocation.section_id;
          semesterId = allocation.sections.semester_id;
          programmeId = allocation.sections.semesters?.programme_id;
        }
      }

      // If only sectionId is provided, resolve semester & programme
      if (sectionId && (!semesterId || !programmeId)) {
        const { data: sectionData, error: secErr } = await supabaseAdmin
          .from('sections')
          .select(`
            id,
            semester_id,
            semesters:semester_id (
              id,
              programme_id
            )
          `)
          .eq('id', sectionId)
          .single();

        if (!secErr && sectionData) {
          semesterId = sectionData.semester_id;
          programmeId = sectionData.semesters?.programme_id;
        }
      }

      // If only semesterId is provided, resolve programme
      if (semesterId && !programmeId) {
        const { data: semData, error: semErr } = await supabaseAdmin
          .from('semesters')
          .select('id, programme_id')
          .eq('id', semesterId)
          .single();

        if (!semErr && semData) {
          programmeId = semData.programme_id;
        }
      }

      // 3. Fetch User's Assigned Scopes
      const { data: scopes, error: scopeErr } = await supabaseAdmin
        .from('team_scope')
        .select('*')
        .eq('user_id', req.user.id);

      if (scopeErr || !scopes || scopes.length === 0) {
        return errorResponse(
          res,
          'Access forbidden: No academic scope permissions assigned to your user account.',
          null,
          403
        );
      }

      // 4. Validate Permission Flag
      const checkPermissionFlag = (scopeRecord) => {
        if (options.action === 'read') return scopeRecord.can_read === true;
        if (options.action === 'write') return scopeRecord.can_write === true;
        if (options.action === 'approve') return scopeRecord.can_approve === true;
        return false;
      };

      // 5. Check Hierarchical Match (Programme -> Semester -> Section)
      const hasAccess = scopes.some((scope) => {
        if (!checkPermissionFlag(scope)) return false;

        // Level 1: Scope covers the entire Programme
        if (scope.scope_level === 'programme' && programmeId && scope.programme_id === programmeId) {
          return true;
        }

        // Level 2: Scope covers the Semester
        if (scope.scope_level === 'semester' && semesterId && scope.semester_id === semesterId) {
          return true;
        }

        // Level 3: Scope covers the specific Section
        if (scope.scope_level === 'section' && sectionId && scope.section_id === sectionId) {
          return true;
        }

        return false;
      });

      if (!hasAccess) {
        return errorResponse(
          res,
          `Access forbidden: You do not have '${options.action}' permission for this Programme, Semester, or Section scope.`,
          {
            requiredScope: { programmeId, semesterId, sectionId },
            requiredAction: options.action,
          },
          403
        );
      }

      // Attach resolved scope context to req for downstream controller usage
      req.resolvedScope = { programmeId, semesterId, sectionId };
      next();
    } catch (err) {
      console.error('[Scope Middleware Error]:', err.message);
      return errorResponse(res, 'Internal scope authorization error', null, 500);
    }
  };
};

module.exports = {
  requireScopeAccess,
};
