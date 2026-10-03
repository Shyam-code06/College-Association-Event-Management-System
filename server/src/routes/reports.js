const express = require('express');
const reportsController = require('../controllers/reports');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const { eventReportParamsSchema } = require('../validations/reports');

const router = express.Router();

router.use(auth, tenant);

// Event report (College Admin & Organizer)
router.get(
  '/events/:eventId',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(eventReportParamsSchema, 'params'),
  asyncHandler(reportsController.getEventReport)
);

// College overview report (College Admin only)
router.get(
  '/college/overview',
  authorize(ROLES.COLLEGE_ADMIN),
  asyncHandler(reportsController.getCollegeOverview)
);

module.exports = router;
