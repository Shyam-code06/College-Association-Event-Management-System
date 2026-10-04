const express = require('express');
const collegeAdminsController = require('../controllers/collegeAdmins');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createCollegeAdminSchema,
  toggleAccessSchema,
  listCollegeAdminsSchema,
  resetCollegeAdminPasswordSchema
} = require('../validations/collegeAdmins');

const router = express.Router();

// Super Admin Only
router.use(auth, authorize(ROLES.SUPER_ADMIN));

router.post(
  '/',
  validate(createCollegeAdminSchema),
  asyncHandler(collegeAdminsController.create)
);

router.get(
  '/',
  validate(listCollegeAdminsSchema, 'query'),
  asyncHandler(collegeAdminsController.list)
);

router.get(
  '/:id',
  asyncHandler(collegeAdminsController.getById)
);

router.patch(
  '/:id/access',
  validate(toggleAccessSchema),
  asyncHandler(collegeAdminsController.toggleAccess)
);

router.post(
  '/:id/reset-password',
  validate(resetCollegeAdminPasswordSchema),
  asyncHandler(collegeAdminsController.resetPassword)
);

router.delete(
  '/:id',
  asyncHandler(collegeAdminsController.softDelete)
);

module.exports = router;
