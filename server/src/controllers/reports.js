const reportsService = require('../services/reports');
const { sendSuccess } = require('../utils/response');

const reportsController = {
  getEventReport: async (req, res) => {
    const report = await reportsService.getEventReport(
      req.params.eventId,
      req.collegeId,
      req.user
    );
    return sendSuccess(res, 200, 'Event report generated successfully', report);
  },

  getCollegeOverview: async (req, res) => {
    const overview = await reportsService.getCollegeOverviewReport(req.collegeId);
    return sendSuccess(res, 200, 'College overview generated successfully', overview);
  }
};

module.exports = reportsController;
