const collegeModel = require('../models/college');

const collegesService = {
  /**
   * Returns list of all active colleges for public student signup.
   *
   * @returns {Promise<Array<{ id: number, name: string, code: string }>>}
   */
  getPublicColleges: async () => {
    return collegeModel.findAllActive();
  }
};

module.exports = collegesService;
