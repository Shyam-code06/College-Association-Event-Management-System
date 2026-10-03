const Joi = require('joi');
const { EVENT_STATUS } = require('../constants/statuses');

const createEventSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().allow(null, ''),
  event_date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required(),
  start_time: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).required(),
  location: Joi.string().trim().min(2).max(200).required(),
  capacity: Joi.number().integer().positive().required(),
  is_paid: Joi.boolean().default(false),
  member_price: Joi.number().min(0).precision(2).default(0),
  non_member_price: Joi.number().min(0).precision(2).default(0),
  status: Joi.string().valid(...Object.values(EVENT_STATUS)).default(EVENT_STATUS.PUBLISHED)
});

const updateEventSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().allow(null, ''),
  event_date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/),
  location: Joi.string().trim().min(2).max(200),
  capacity: Joi.number().integer().positive(),
  is_paid: Joi.boolean(),
  member_price: Joi.number().min(0).precision(2),
  non_member_price: Joi.number().min(0).precision(2),
  status: Joi.string().valid(...Object.values(EVENT_STATUS))
}).min(1);

const listEventsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(EVENT_STATUS)),
  upcomingOnly: Joi.string().valid('true', 'false'),
  search: Joi.string().trim().allow('')
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  listEventsSchema
};
