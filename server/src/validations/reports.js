const Joi = require('joi');

const eventReportParamsSchema = Joi.object({
  eventId: Joi.number().integer().positive().required()
});

module.exports = {
  eventReportParamsSchema
};
