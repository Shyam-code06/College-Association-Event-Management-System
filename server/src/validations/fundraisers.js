const Joi = require('joi');
const { FUNDRAISER_STATUS, FUNDRAISER_TASK_STATUS } = require('../constants/statuses');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const createFundraiserSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  goal_amount: Joi.number().min(0).precision(2).default(1),
  target_amount: Joi.number().min(0).precision(2).default(1),
  start_date: Joi.string().allow(null, ''),
  end_date: Joi.string().allow(null, ''),
  status: Joi.string().valid(...Object.values(FUNDRAISER_STATUS)).default(FUNDRAISER_STATUS.ACTIVE)
}).unknown(true);

const updateFundraiserSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().allow(null, ''),
  goal_amount: Joi.number().min(0).precision(2),
  target_amount: Joi.number().min(0).precision(2),
  current_amount: Joi.number().min(0).precision(2),
  start_date: Joi.string().allow(null, ''),
  end_date: Joi.string().allow(null, ''),
  status: Joi.string().valid(...Object.values(FUNDRAISER_STATUS))
}).min(1).unknown(true);

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  assignee_id: Joi.number().integer().positive().required(),
  due_date: Joi.string().allow(null, '')
}).unknown(true);

const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .custom((val, helpers) => {
      const lower = String(val).toLowerCase();
      if (lower === 'todo' || lower === 'pending') return 'pending';
      if (lower === 'in_progress') return 'in_progress';
      if (lower === 'done' || lower === 'completed') return 'completed';
      return helpers.error('any.invalid');
    })
    .required()
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
