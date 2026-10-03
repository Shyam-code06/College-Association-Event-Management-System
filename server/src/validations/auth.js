const Joi = require('joi');

const registerSchema = Joi.object({
  college_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
  password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema
};
