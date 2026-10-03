const Joi = require('joi');

const scanTicketSchema = Joi.object({
  qrToken: Joi.string().trim().required(),
  eventId: Joi.number().integer().positive().required()
});

module.exports = {
  scanTicketSchema
};
