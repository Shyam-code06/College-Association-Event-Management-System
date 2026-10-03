const express = require('express');
const membershipsController = require('../controllers/memberships');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const {
  createPlanSchema,
  updatePlanSchema,
  joinMembershipSchema,
  listMembersSchema,
  verifyMemberSchema
} = require('../validations/memberships');

const router = express.Router();

router.use(auth, tenant);

// Public within college (Student, Organizer, College Admin)
router.get('/plans', asyncHandler(membershipsController.listPlans));

// College Admin: manage plans
router.post(
  '/plans',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(createPlanSchema),
  asyncHandler(membershipsController.createPlan)
);

router.patch(
  '/plans/:id',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(updatePlanSchema),
  asyncHandler(membershipsController.updatePlan)
);

// Student: join / my status
router.post(
  '/join',
  authorize(ROLES.STUDENT),
  validate(joinMembershipSchema),
  asyncHandler(membershipsController.join)
);

router.get(
  '/me',
  authorize(ROLES.STUDENT),
  asyncHandler(membershipsController.getMyMembership)
);

// College Admin: list all members
router.get(
  '/',
  authorize(ROLES.COLLEGE_ADMIN),
  validate(listMembersSchema, 'query'),
  asyncHandler(membershipsController.listMembers)
);

// College Admin & Organizer: verify member status at gate
router.get(
  '/verify',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(verifyMemberSchema, 'query'),
  asyncHandler(membershipsController.verifyStatus)
);

module.exports = router;
