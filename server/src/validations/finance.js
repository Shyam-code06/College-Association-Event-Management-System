const Joi = require('joi');
const { FINANCE_TYPE } = require('../constants/statuses');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  type: Joi.string().trim().lowercase().valid(...Object.values(FINANCE_TYPE)).required()
}).unknown(true);

const addTransactionSchema = Joi.object({
  type: Joi.string().trim().lowercase().valid(...Object.values(FINANCE_TYPE)).required(),
  category_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().trim().min(3).max(255).required(),
  transaction_date: Joi.string().allow(null, '')
}).unknown(true);

const listTransactionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid(...Object.values(FINANCE_TYPE)),
  categoryId: Joi.number().integer().positive(),
  startDate: Joi.string().regex(datePattern),
  endDate: Joi.string().regex(datePattern)
});

const summarySchema = Joi.object({
  startDate: Joi.string().regex(datePattern),
  endDate: Joi.string().regex(datePattern)
});

module.exports = {
  createCategorySchema,
  addTransactionSchema,
  listTransactionsSchema,
  summarySchema
};
