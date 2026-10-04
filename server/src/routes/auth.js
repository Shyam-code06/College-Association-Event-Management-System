const express = require('express');
const authController = require('../controllers/auth');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordRequestSchema,
  verifyOtpSchema,
  resetPasswordWithOtpSchema
} = require('../validations/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', auth, asyncHandler(authController.getMe));
router.post('/change-password', auth, validate(changePasswordSchema), asyncHandler(authController.changePassword));
router.post('/request-approval', asyncHandler(authController.requestApproval));
router.post('/check-campus', asyncHandler(authController.checkCampus));

// Student-only Forgot Password with OTP
router.post('/forgot-password/request', validate(forgotPasswordRequestSchema), asyncHandler(authController.forgotPasswordRequest));
router.post('/forgot-password/verify-otp', validate(verifyOtpSchema), asyncHandler(authController.verifyResetOtp));
router.post('/forgot-password/reset', validate(resetPasswordWithOtpSchema), asyncHandler(authController.resetPasswordWithOtp));

module.exports = router;


