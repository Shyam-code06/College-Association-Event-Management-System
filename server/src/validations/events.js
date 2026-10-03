const Joi = require('joi');
const { EVENT_STATUS } = require('../constants/statuses');

const createEventSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  title: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().allow(null, ''),
  event_date: Joi.string().required(),
  start_time: Joi.string().allow(null, ''),
  location: Joi.string().trim().min(2).max(200),
  venue: Joi.string().trim().min(2).max(200),
  capacity: Joi.number().integer().positive().required(),
  is_paid: Joi.boolean().default(false),
  member_price: Joi.number().min(0).precision(2).default(0),
  non_member_price: Joi.number().min(0).precision(2).default(0),
  price: Joi.number().min(0).precision(2),
  status: Joi.string().valid(...Object.values(EVENT_STATUS)).default(EVENT_STATUS.PUBLISHED)
}).unknown(true);

const updateEventSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  title: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().allow(null, ''),
  event_date: Joi.string(),
  start_time: Joi.string().allow(null, ''),
  location: Joi.string().trim().min(2).max(200),
  venue: Joi.string().trim().min(2).max(200),
  capacity: Joi.number().integer().positive(),
  is_paid: Joi.boolean(),
  member_price: Joi.number().min(0).precision(2),
  non_member_price: Joi.number().min(0).precision(2),
  price: Joi.number().min(0).precision(2),
  status: Joi.string().valid(...Object.values(EVENT_STATUS))
}).min(1).unknown(true);

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
