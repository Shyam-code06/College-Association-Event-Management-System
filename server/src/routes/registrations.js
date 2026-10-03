const express = require('express');
const registrationsController = require('../controllers/registrations');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  registerEventSchema,
  listRegistrationsSchema
} = require('../validations/registrations');

const router = express.Router();

router.use(auth, tenant);

// Student registration
router.post(
  '/',
  authorize(ROLES.STUDENT),
  validate(registerEventSchema),
  asyncHandler(registrationsController.register)
);

// Student own registrations
router.get(
  '/me',
  authorize(ROLES.STUDENT),
  asyncHandler(registrationsController.getMyRegistrations)
);

// College Admin & Organizer: view event attendees/registrations
router.get(
  '/event/:eventId',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(listRegistrationsSchema, 'query'),
  asyncHandler(registrationsController.getEventRegistrations)
);

module.exports = router;
