const express = require('express');
const financeController = require('../controllers/finance');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createCategorySchema,
  addTransactionSchema,
  listTransactionsSchema,
  summarySchema
} = require('../validations/finance');

const router = express.Router();

// College Admin Only
router.use(auth, authorize(ROLES.COLLEGE_ADMIN), tenant);

router.get('/categories', asyncHandler(financeController.listCategories));
router.post(
  '/categories',
  validate(createCategorySchema),
  asyncHandler(financeController.createCategory)
);

router.get(
  '/transactions',
  validate(listTransactionsSchema, 'query'),
  asyncHandler(financeController.listTransactions)
);

router.post(
  '/transactions',
  validate(addTransactionSchema),
  asyncHandler(financeController.addTransaction)
);

router.post(
  '/manual',
  validate(addTransactionSchema),
  asyncHandler(financeController.addTransaction)
);

router.get(
  '/summary',
  validate(summarySchema, 'query'),
  asyncHandler(financeController.getSummary)
);

module.exports = router;
