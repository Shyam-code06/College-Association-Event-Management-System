const express = require('express');
const collegesController = require('../controllers/colleges');
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Require Bearer token authentication to access college records
router.use(auth);

router.get('/public', asyncHandler(collegesController.getPublicColleges));
router.get('/', asyncHandler(collegesController.getPublicColleges));

module.exports = router;

