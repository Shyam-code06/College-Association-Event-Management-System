const Joi = require('joi');

const registerSchema = Joi.object({
  college_id: Joi.number().integer().positive().optional().allow(null),
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

const forgotPasswordRequestSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().trim().length(6).required()
});

const resetPasswordWithOtpSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().trim().optional().allow(''),
  resetToken: Joi.string().trim().optional().allow(''),
  newPassword: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().min(6).max(100).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordRequestSchema,
  verifyOtpSchema,
  resetPasswordWithOtpSchema
};

