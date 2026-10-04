const express = require('express');
const paymentsController = require('../controllers/payments');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  processPaymentSchema,
  listPendingPaymentsSchema,
  listPaymentsSchema
} = require('../validations/payments');

const router = express.Router();

router.use(auth, tenant);

// College Admin: all or filtered payments (pending, approved, all)
router.get(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(listPaymentsSchema, 'query'),
  asyncHandler(paymentsController.getAllPayments)
);

// Student & College Admin can process payment (mock gateway trigger)
router.post(
  '/:id/process',
  authorize(ROLES.STUDENT, ROLES.COLLEGE_ADMIN),
  validate(processPaymentSchema),
  asyncHandler(paymentsController.processPayment)
);

// College Admin: pending payments
router.get(
  '/pending',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(listPendingPaymentsSchema, 'query'),
  asyncHandler(paymentsController.getPendingPayments)
);

// Student: own payments
router.get(
  '/me',
  authorize(ROLES.STUDENT),
  asyncHandler(paymentsController.getStudentPayments)
);

// Get single payment
router.get(
  '/:id',
  asyncHandler(paymentsController.getById)
);

module.exports = router;
