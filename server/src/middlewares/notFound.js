const AppError = require('../utils/appError');

const notFound = (req, _res, next) => {
  next(new AppError(`Resource not found at ${req.originalUrl}`, 404));
};

module.exports = notFound;
