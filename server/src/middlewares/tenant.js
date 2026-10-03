const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');

/**
 * Tenant scoping middleware.
 * Guarantees that college-level endpoints require a valid collegeId from the authenticated user.
 * Blocks super_admin from accessing college operations (returns 403).
 */
const tenant = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before tenant scoping', 401));
  }

  if (req.user.role === ROLES.SUPER_ADMIN || !req.user.collegeId) {
    return next(
      new AppError(
        'Super admin and unassigned users are strictly forbidden from accessing college-level resources',
        403
      )
    );
  }

  // Bind authenticated tenant collegeId
  req.collegeId = req.user.collegeId;

  // Sanitize any client attempts to inject college_id via body or query
  if (req.body && typeof req.body === 'object') {
    delete req.body.college_id;
    delete req.body.collegeId;
  }
  if (req.query && typeof req.query === 'object') {
    delete req.query.college_id;
    delete req.query.collegeId;
  }

  return next();
};

module.exports = tenant;
