const express = require('express');
const organizersController = require('../controllers/organizers');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createOrganizerSchema,
  updateOrganizerSchema,
  toggleOrganizerAccessSchema,
  listOrganizersSchema
} = require('../validations/organizers');

const router = express.Router();

// College Admin Only, College-Scoped
router.use(auth, authorize(ROLES.COLLEGE_ADMIN), tenant);

router.post(
  '/',
  validate(createOrganizerSchema),
  asyncHandler(organizersController.create)
);

router.get(
  '/',
  validate(listOrganizersSchema, 'query'),
  asyncHandler(organizersController.list)
);

router.get(
  '/:id',
  asyncHandler(organizersController.getById)
);

router.patch(
  '/:id',
  validate(updateOrganizerSchema),
  asyncHandler(organizersController.update)
);
router.put(
  '/:id',
  validate(updateOrganizerSchema),
  asyncHandler(organizersController.update)
);

router.patch(
  '/:id/access',
  validate(toggleOrganizerAccessSchema),
  asyncHandler(organizersController.toggleAccess)
);

router.delete(
  '/:id',
  asyncHandler(organizersController.softDelete)
);

module.exports = router;
