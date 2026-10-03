const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit of 5MB';
    } else {
      message = err.message;
    }
  }

  // Handle Knex/MySQL unique constraint error
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this unique identifier already exists';
  }

  // Handle MySQL check constraint violation
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    statusCode = 400;
    message = 'Invalid data values violate database integrity checks';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  if (statusCode === 500) {
    logger.error(`[Unhandled Error] ${err.message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
    if (env.NODE_ENV === 'production') {
      message = 'An unexpected internal error occurred';
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = errorHandler;
