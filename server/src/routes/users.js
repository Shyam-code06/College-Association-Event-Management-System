const express = require('express');
const usersController = require('../controllers/users');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const { listCollegeUsersSchema, toggleUserStatusSchema, approveAllUsersSchema } = require('../validations/users');

const router = express.Router();

router.use(auth, tenant);

router.get(
  '/',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(listCollegeUsersSchema, 'query'),
  asyncHandler(usersController.listCollegeUsers)
);

router.post(
  '/approve-all',
  validate(approveAllUsersSchema),
  asyncHandler(usersController.approveAllUsers)
);

router.patch(
  '/:id/status',
  validate(toggleUserStatusSchema),
  asyncHandler(usersController.toggleUserStatus)
);

router.delete(
  '/:id',
  asyncHandler(usersController.deleteUser)
);

module.exports = router;

