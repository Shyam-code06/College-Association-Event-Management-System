const express = require('express');
const fundraisersController = require('../controllers/fundraisers');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createFundraiserSchema,
  updateFundraiserSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  listFundraisersSchema
} = require('../validations/fundraisers');

const router = express.Router();

router.use(auth, tenant);

// Student: personal assigned tasks
router.get(
  '/tasks/me',
  authorize(ROLES.STUDENT),
  asyncHandler(fundraisersController.getStudentTasks)
);

// Student or Admin: update task status
router.patch(
  '/tasks/:taskId/status',
  authorize(ROLES.STUDENT, ROLES.COLLEGE_ADMIN),
  validate(updateTaskStatusSchema),
  asyncHandler(fundraisersController.updateTaskStatus)
);

// All college users can list and view fundraisers
router.get(
  '/',
  validate(listFundraisersSchema, 'query'),
  asyncHandler(fundraisersController.listFundraisers)
);

router.get(
  '/:id',
  asyncHandler(fundraisersController.getFundraiserById)
);

// College Admin: create, update, and assign tasks
router.post(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(createFundraiserSchema),
  asyncHandler(fundraisersController.createFundraiser)
);

router.patch(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(updateFundraiserSchema),
  asyncHandler(fundraisersController.updateFundraiser)
);
router.put(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(updateFundraiserSchema),
  asyncHandler(fundraisersController.updateFundraiser)
);

router.post(
  '/:id/tasks',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(createTaskSchema),
  asyncHandler(fundraisersController.createTask)
);

module.exports = router;
