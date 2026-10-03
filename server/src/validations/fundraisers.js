const Joi = require('joi');
const { FUNDRAISER_STATUS, FUNDRAISER_TASK_STATUS } = require('../constants/statuses');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const createFundraiserSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  goal_amount: Joi.number().positive().precision(2).required(),
  start_date: Joi.string().regex(datePattern).required(),
  end_date: Joi.string().regex(datePattern).required(),
  status: Joi.string().valid(...Object.values(FUNDRAISER_STATUS)).default(FUNDRAISER_STATUS.ACTIVE)
});

const updateFundraiserSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().allow(null, ''),
  goal_amount: Joi.number().positive().precision(2),
  current_amount: Joi.number().min(0).precision(2),
  start_date: Joi.string().regex(datePattern),
  end_date: Joi.string().regex(datePattern),
  status: Joi.string().valid(...Object.values(FUNDRAISER_STATUS))
}).min(1);

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  assignee_id: Joi.number().integer().positive().required(),
  due_date: Joi.string().regex(datePattern).allow(null)
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(FUNDRAISER_TASK_STATUS)).required()
});

const listFundraisersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(FUNDRAISER_STATUS))
});

module.exports = {
  createFundraiserSchema,
  updateFundraiserSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  listFundraisersSchema
};
