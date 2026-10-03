const express = require('express');
const expensesController = require('../controllers/expenses');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const { uploadReceipt } = require('../middlewares/upload');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  submitExpenseSchema,
  reviewExpenseSchema,
  listExpensesSchema
} = require('../validations/expenses');

const router = express.Router();

router.use(auth, tenant);

// Student & Organizer: submit expense with receipt
router.post(
  '/',
  authorize(ROLES.STUDENT, ROLES.ORGANIZER),
  uploadReceipt.single('receipt'),
  validate(submitExpenseSchema),
  asyncHandler(expensesController.submit)
);

// Student & Organizer: personal submitted expenses
router.get(
  '/me',
  authorize(ROLES.STUDENT, ROLES.ORGANIZER),
  asyncHandler(expensesController.getStudentExpenses)
);

// College Admin: list all expenses
router.get(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(listExpensesSchema, 'query'),
  asyncHandler(expensesController.listAll)
);

// College Admin & Submitter: view single expense
router.get(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.STUDENT, ROLES.ORGANIZER),
  asyncHandler(expensesController.getById)
);

// College Admin: approve/reject expense
router.patch(
  '/:id/review',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(reviewExpenseSchema),
  asyncHandler(expensesController.review)
);

module.exports = router;
