const collegesService = require('../services/colleges');
const { sendSuccess } = require('../utils/response');

const collegesController = {
  getPublicColleges: async (_req, res) => {
    const colleges = await collegesService.getPublicColleges();
    return sendSuccess(res, 200, 'Colleges retrieved successfully', colleges);
  }
};

module.exports = collegesController;
