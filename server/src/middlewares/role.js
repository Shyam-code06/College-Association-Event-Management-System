const AppError = require('../utils/appError');

/**
 * Role authorization middleware.
 * Verifies that the authenticated user possesses one of the allowed roles.
 *
 * @param {...string} allowedRoles
 */
const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before authorization check', 401));
  }

  // Flatten if an array was passed
  const roles = allowedRoles.flat();

  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Role '${req.user.role}' is not authorized to access this resource.`,
        403
      )
    );
  }

  return next();
};

module.exports = authorize;
