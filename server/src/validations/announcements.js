const Joi = require('joi');

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  message: Joi.string().trim().min(1).optional(),
  content: Joi.string().trim().min(1).optional(),
  priority: Joi.string().trim().optional().allow('')
}).or('message', 'content');

const listAnnouncementsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  createAnnouncementSchema,
  listAnnouncementsSchema
};
