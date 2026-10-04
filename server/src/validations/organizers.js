const Joi = require('joi');

const createOrganizerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(6).max(100).required()
});

const updateOrganizerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email().max(150)
}).min(1);

const toggleOrganizerAccessSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const listOrganizersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow(''),
  isActive: Joi.string().valid('true', 'false')
});

const resetOrganizerPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(100).default('123456').allow('', null)
});

module.exports = {
  createOrganizerSchema,
  updateOrganizerSchema,
  toggleOrganizerAccessSchema,
  listOrganizersSchema,
  resetOrganizerPasswordSchema
};
