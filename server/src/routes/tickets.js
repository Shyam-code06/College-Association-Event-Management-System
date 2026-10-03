const express = require('express');
const ticketsController = require('../controllers/tickets');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const tenant = require('../middlewares/tenant');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');
const { scanTicketSchema } = require('../validations/tickets');

const router = express.Router();

router.use(auth, tenant);

// Student: get QR Data URL for owned ticket
router.get(
  '/:registrationId/qr',
  authorize(ROLES.STUDENT),
  asyncHandler(ticketsController.getQrCode)
);

// Organizer & College Admin: scan ticket at gate
router.post(
  '/scan',
  authorize(ROLES.COLLEGE_ADMIN, ROLES.ORGANIZER),
  validate(scanTicketSchema),
  asyncHandler(ticketsController.scan)
);

module.exports = router;
