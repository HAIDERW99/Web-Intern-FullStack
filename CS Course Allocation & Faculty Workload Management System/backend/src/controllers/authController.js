const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { supabaseAdmin } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logActivity } = require('../utils/activityLogger');

/**
 * Auth Controller
 */

// User Login (Validates credentials and generates JWT)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', null, 400);
    }

    // Fetch user with hashed password
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, email, encrypted_password, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userErr || !user) {
      return errorResponse(res, 'Invalid email or password', null, 401);
    }

    if (!user.is_active) {
      return errorResponse(res, 'Account is deactivated. Contact Department Administrator.', null, 403);
    }

    // Verify Password (supports bcrypt)
    const isMatch = await bcrypt.compare(password, user.encrypted_password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', null, 401);
    }

    // Fetch Profile & Scope
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: scopes } = await supabaseAdmin
      .from('team_scope')
      .select('*')
      .eq('user_id', user.id);

    // Update last sign in
    await supabaseAdmin
      .from('users')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: profile?.system_role || 'faculty_member',
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Log Activity
    await logActivity({
      userId: user.id,
      actionType: 'USER_LOGIN',
      entityName: 'users',
      entityId: user.id,
      newValues: { login_time: new Date().toISOString() },
      req,
    });

    return successResponse(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        email: user.email,
        profile,
        scopes: scopes || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get Current User Profile & Assigned Scopes
const getMe = async (req, res, next) => {
  try {
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (profileErr) {
      return errorResponse(res, 'Failed to fetch user profile', null, 500);
    }

    const { data: scopes } = await supabaseAdmin
      .from('team_scope')
      .select(`
        *,
        programmes:programme_id (id, code, name),
        semesters:semester_id (id, semester_number),
        sections:section_id (id, name)
      `)
      .eq('user_id', req.user.id);

    return successResponse(res, 'Profile retrieved successfully', {
      user: req.user,
      profile,
      assignedScopes: scopes || [],
    });
  } catch (err) {
    next(err);
  }
};

// Assign Scope to Team Member (HOD / Admin only)
const assignScope = async (req, res, next) => {
  try {
    const {
      user_id,
      scope_level,
      programme_id = null,
      semester_id = null,
      section_id = null,
      can_read = true,
      can_write = false,
      can_approve = false,
    } = req.body;

    if (!user_id || !scope_level) {
      return errorResponse(res, 'user_id and scope_level are required', null, 400);
    }

    const { data: scope, error: scopeErr } = await supabaseAdmin
      .from('team_scope')
      .insert({
        user_id,
        scope_level,
        programme_id,
        semester_id,
        section_id,
        can_read,
        can_write,
        can_approve,
      })
      .select()
      .single();

    if (scopeErr) {
      return errorResponse(res, 'Failed to assign scope: ' + scopeErr.message, null, 400);
    }

    // Audit Log
    await logActivity({
      userId: req.user.id,
      actionType: 'SCOPE_ASSIGNED',
      entityName: 'team_scope',
      entityId: scope.id,
      newValues: scope,
      req,
    });

    return successResponse(res, 'Scope assigned successfully', scope, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
  assignScope,
};
