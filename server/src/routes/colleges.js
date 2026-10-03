const express = require('express');
const collegesController = require('../controllers/colleges');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/public', asyncHandler(collegesController.getPublicColleges));

module.exports = router;
