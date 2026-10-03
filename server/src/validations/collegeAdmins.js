const Joi = require('joi');

const createCollegeAdminSchema = Joi.object({
  collegeName: Joi.string().trim().min(3).max(150).required(),
  collegeCode: Joi.string().trim().min(2).max(50).uppercase().optional().allow('', null),
  collegeDomain: Joi.string().trim().min(3).max(100).lowercase().optional().allow('', null),
  adminName: Joi.string().trim().min(2).max(100).required(),
  adminEmail: Joi.string().trim().email().max(150).required(),
  adminPassword: Joi.string().min(6).max(100).required()
});

const toggleAccessSchema = Joi.object({
  isActive: Joi.boolean().optional()
});

const listCollegeAdminsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow(''),
  isActive: Joi.string().valid('true', 'false')
});

module.exports = {
  createCollegeAdminSchema,
  toggleAccessSchema,
  listCollegeAdminsSchema
};
