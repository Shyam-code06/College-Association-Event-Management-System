const AppError = require('../utils/appError');

/**
 * Validates request data against a Joi schema.
 *
 * @param {object} schema - Joi schema
 * @param {'body'|'query'|'params'} source - Target request property
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, '')
    }));

    return next(new AppError('Validation failed', 400, errorDetails));
  }

  req[source] = value;
  return next();
};

module.exports = validate;
