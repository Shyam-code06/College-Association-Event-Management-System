const Joi = require('joi');
const { REGISTRATION_STATUS } = require('../constants/statuses');

const registerEventSchema = Joi.object({
  eventId: Joi.number().integer().positive().required()
});

const listRegistrationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(REGISTRATION_STATUS))
});

module.exports = {
  registerEventSchema,
  listRegistrationsSchema
};
