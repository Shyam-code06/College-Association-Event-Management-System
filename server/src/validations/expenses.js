const Joi = require('joi');
const { EXPENSE_STATUS } = require('../constants/statuses');

const submitExpenseSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  reason: Joi.string().trim().min(3).max(255).required(),
  event_id: Joi.number().integer().positive().allow(null, ''),
  fundraiser_id: Joi.number().integer().positive().allow(null, '')
});

const reviewExpenseSchema = Joi.object({
  status: Joi.string().trim().lowercase().valid(EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.REJECTED).required(),
  review_note: Joi.string().trim().allow(null, '')
});

const listExpensesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(EXPENSE_STATUS))
});

module.exports = {
  submitExpenseSchema,
  reviewExpenseSchema,
  listExpensesSchema
};
