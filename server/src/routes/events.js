const express = require('express');
const eventsController = require('../controllers/events');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createEventSchema,
  updateEventSchema,
  listEventsSchema
} = require('../validations/events');

const router = express.Router();

router.use(auth, tenant);

// All college users can list and view events
router.get(
  '/',
  validate(listEventsSchema, 'query'),
  asyncHandler(eventsController.list)
);

router.get(
  '/:id',
  asyncHandler(eventsController.getById)
);

// College Admin & Organizer can create events
router.post(
  '/',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(createEventSchema),
  asyncHandler(eventsController.create)
);

// College Admin & Organizer can update events
router.patch(
  '/:id',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(updateEventSchema),
  asyncHandler(eventsController.update)
);

// College Admin & Organizer can cancel events
router.post(
  '/:id/cancel',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  asyncHandler(eventsController.cancel)
);

module.exports = router;
