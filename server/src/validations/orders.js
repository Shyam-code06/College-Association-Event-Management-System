const Joi = require('joi');
const { ORDER_STATUS } = require('../constants/statuses');

const createOrderSchema = Joi.object({
  variantId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().default(1)
});

const listOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(ORDER_STATUS))
});

module.exports = {
  createOrderSchema,
  listOrdersSchema
};
