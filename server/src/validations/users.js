const Joi = require('joi');
const { ALL_ROLES } = require('../constants/roles');

const listCollegeUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid(...ALL_ROLES),
  search: Joi.string().trim().allow('')
});

const toggleUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const approveAllUsersSchema = Joi.object({
  role: Joi.string().valid(...ALL_ROLES).optional()
});

module.exports = {
  listCollegeUsersSchema,
  toggleUserStatusSchema,
  approveAllUsersSchema
};

