const Joi = require('joi');

const scanTicketSchema = Joi.object({
  qrToken: Joi.string().trim().required(),
  eventId: Joi.number().integer().positive().required()
});

const deleteAttendanceSchema = Joi.object({
  registrationId: Joi.number().integer().positive().optional(),
  qrToken: Joi.string().trim().optional(),
  reason: Joi.string().trim().min(3).max(255).required()
}).or('registrationId', 'qrToken');

module.exports = {
  scanTicketSchema,
  deleteAttendanceSchema
};
