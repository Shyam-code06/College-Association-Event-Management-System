const express = require('express');
const ordersController = require('../controllers/orders');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createOrderSchema,
  listOrdersSchema
} = require('../validations/orders');

const router = express.Router();

router.use(auth, tenant);

// Student places order
router.post(
  '/',
  authorize(ROLES.STUDENT),
  validate(createOrderSchema),
  asyncHandler(ordersController.create)
);

// Student personal orders
router.get(
  '/me',
  authorize(ROLES.STUDENT),
  asyncHandler(ordersController.getStudentOrders)
);

// College Admin lists all orders
router.get(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(listOrdersSchema, 'query'),
  asyncHandler(ordersController.listAll)
);

router.get(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.STUDENT),
  asyncHandler(ordersController.getById)
);

module.exports = router;
