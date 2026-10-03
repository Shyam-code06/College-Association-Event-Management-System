const express = require('express');
const announcementsController = require('../controllers/announcements');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createAnnouncementSchema,
  listAnnouncementsSchema
} = require('../validations/announcements');

const router = express.Router();

router.use(auth, tenant);

// All college users can list and view announcements
router.get(
  '/',
  validate(listAnnouncementsSchema, 'query'),
  asyncHandler(announcementsController.list)
);

router.get(
  '/:id',
  asyncHandler(announcementsController.getById)
);

// College Admin & Organizer can create announcements
router.post(
  '/',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(createAnnouncementSchema),
  asyncHandler(announcementsController.create)
);

module.exports = router;
