const Joi = require('joi');
const { MEMBERSHIP_STATUS } = require('../constants/statuses');

const createPlanSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  fee: Joi.number().min(0).precision(2).required(),
  duration_months: Joi.number().integer().positive().default(12),
  ticket_discount_note: Joi.string().trim().max(255).allow(null, ''),
  merch_discount_percent: Joi.number().min(0).max(100).precision(2).default(0)
});

const updatePlanSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  fee: Joi.number().min(0).precision(2),
  duration_months: Joi.number().integer().positive(),
  ticket_discount_note: Joi.string().trim().max(255).allow(null, ''),
  merch_discount_percent: Joi.number().min(0).max(100).precision(2),
  is_active: Joi.boolean()
}).min(1);

const joinMembershipSchema = Joi.object({
  planId: Joi.number().integer().positive().required()
});

const listMembersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(MEMBERSHIP_STATUS)),
  search: Joi.string().trim().allow('')
});

const verifyMemberSchema = Joi.object({
  identifier: Joi.string().trim().required()
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  joinMembershipSchema,
  listMembersSchema,
  verifyMemberSchema
};
