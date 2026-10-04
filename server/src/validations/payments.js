const Joi = require('joi');

const processPaymentSchema = Joi.object({
  shouldSucceed: Joi.boolean().default(true)
});

const listPendingPaymentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().allow('', 'all', 'pending', 'success', 'approved', 'failed').optional(),
  search: Joi.string().allow('').optional()
});

const listPaymentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().allow('', 'all', 'pending', 'success', 'approved', 'failed').optional(),
  search: Joi.string().allow('').optional()
});

module.exports = {
  processPaymentSchema,
  listPendingPaymentsSchema,
  listPaymentsSchema
};
