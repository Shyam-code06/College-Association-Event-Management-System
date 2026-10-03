const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');

const auth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication token is missing or malformed', 401));
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      return next(new AppError('Invalid or expired authentication token', 401));
    }

    // Load user from database
    const user = await db('users')
      .where({ id: decoded.id })
      .first();

    if (!user || user.deleted_at !== null) {
      return next(new AppError('User account does not exist or has been deleted', 401));
    }

    if (!user.is_active) {
      return next(new AppError('User account is deactivated. Access denied.', 403));
    }

    // For non-super_admin users, verify college and college admin status
    if (user.role !== ROLES.SUPER_ADMIN) {
      if (!user.college_id) {
        return next(new AppError('User is not associated with any college', 403));
      }

      const college = await db('colleges')
        .where({ id: user.college_id })
        .first();

      if (!college || college.deleted_at !== null || !college.is_active) {
        return next(new AppError('College is deactivated or deleted. Access denied.', 403));
      }

      // Check College Admin status for this college
      const collegeAdmin = await db('users')
        .where({
          college_id: user.college_id,
          role: ROLES.COLLEGE_ADMIN
        })
        .whereNull('deleted_at')
        .first();

      if (!collegeAdmin || !collegeAdmin.is_active) {
        return next(new AppError('College administrator is deactivated or removed. Access denied.', 403));
      }
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.college_id
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = auth;
