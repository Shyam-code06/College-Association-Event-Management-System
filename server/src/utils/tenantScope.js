const AppError = require('./appError');

/**
 * Validates that collegeId is present and a positive integer.
 * Throws AppError if invalid.
 *
 * @param {number|string} collegeId
 * @returns {number}
 */
const enforceCollegeId = (collegeId) => {
  const parsed = parseInt(collegeId, 10);
  if (!parsed || parsed <= 0) {
    throw new AppError('College ID is required for tenant isolation', 400);
  }
  return parsed;
};

/**
 * Applies tenant isolation where clause to Knex query builder.
 *
 * @param {object} query - Knex query builder
 * @param {number|string} collegeId - College ID of authenticated user
 * @param {string} [tableName] - Optional table alias/name
 * @returns {object} Knex query builder
 */
const applyTenantScope = (query, collegeId, tableName = '') => {
  const validCollegeId = enforceCollegeId(collegeId);
  const column = tableName ? `${tableName}.college_id` : 'college_id';
  return query.where(column, validCollegeId);
};

module.exports = {
  enforceCollegeId,
  applyTenantScope
};
