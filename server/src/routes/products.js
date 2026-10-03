const express = require('express');
const productsController = require('../controllers/products');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantStockSchema,
  listProductsSchema
} = require('../validations/products');

const router = express.Router();

router.use(auth, tenant);

// All college users can browse products
router.get(
  '/',
  validate(listProductsSchema, 'query'),
  asyncHandler(productsController.list)
);

// College Admin inventory summary
router.get(
  '/inventory/summary',
  authorize(ROLES.COLLEGE_ADMIN),
  asyncHandler(productsController.getInventory)
);

router.get(
  '/:id',
  asyncHandler(productsController.getById)
);

// College Admin product management
router.post(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(createProductSchema),
  asyncHandler(productsController.create)
);

router.patch(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(updateProductSchema),
  asyncHandler(productsController.update)
);

router.post(
  '/:id/variants',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(addVariantSchema),
  asyncHandler(productsController.addVariant)
);

router.patch(
  '/variants/:variantId/stock',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(updateVariantStockSchema),
  asyncHandler(productsController.updateVariantStock)
);

module.exports = router;
