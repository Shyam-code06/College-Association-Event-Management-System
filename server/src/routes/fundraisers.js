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

// Student, Organizer or Admin: update task status
router.patch(
  '/tasks/:taskId/status',
  authorize(ROLES.STUDENT, ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
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

// College Admin & Organizer: create, update, and assign tasks
router.post(
  '/',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(createFundraiserSchema),
  asyncHandler(fundraisersController.createFundraiser)
);

router.patch(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(updateFundraiserSchema),
  asyncHandler(fundraisersController.updateFundraiser)
);
router.put(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(updateFundraiserSchema),
  asyncHandler(fundraisersController.updateFundraiser)
);

router.post(
  '/:id/tasks',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(createTaskSchema),
  asyncHandler(fundraisersController.createTask)
);

module.exports = router;
