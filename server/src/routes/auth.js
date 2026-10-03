const express = require('express');
const authController = require('../controllers/auth');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema
} = require('../validations/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', auth, asyncHandler(authController.getMe));
router.post('/change-password', auth, validate(changePasswordSchema), asyncHandler(authController.changePassword));

module.exports = router;
