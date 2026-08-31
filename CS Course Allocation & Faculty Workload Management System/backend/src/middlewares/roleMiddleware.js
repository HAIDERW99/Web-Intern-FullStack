const { errorResponse } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middlewares
 */

/**
 * Restrict endpoint to specified list of roles
 * @param  {...string} allowedRoles
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', null, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        null,
        403
      );
    }

    next();
  };
};

/**
 * Restrict endpoint exclusively to HOD (or Dean / System Administrator)
 * Grants full departmental override and final allocation sign-off authority.
 */
const requireHOD = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', null, 401);
  }

  const authorizedRoles = ['hod', 'dean', 'admin'];
  if (!authorizedRoles.includes(req.user.role)) {
    return errorResponse(
      res,
      'Access denied. Only Head of Department (HOD) or authorized administrators can perform this action.',
      null,
      403
    );
  }

  next();
};

/**
 * Check if the user is a Convener / Coordinator / HOD / Admin
 */
const requireConvenerOrHigher = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', null, 401);
  }

  const authorizedRoles = ['convener', 'coordinator', 'hod', 'dean', 'admin'];
  if (!authorizedRoles.includes(req.user.role)) {
    return errorResponse(
      res,
      'Access denied. Action requires Course Convener, Coordinator, or HOD privileges.',
      null,
      403
    );
  }

  next();
};

module.exports = {
  requireRoles,
  requireHOD,
  requireConvenerOrHigher,
};
