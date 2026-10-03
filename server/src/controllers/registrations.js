const registrationsService = require('../services/registrations');
const { sendSuccess } = require('../utils/response');

const registrationsController = {
  register: async (req, res) => {
    const result = await registrationsService.registerForEvent(
      req.user.id,
      req.collegeId,
      req.body.eventId
    );
    return sendSuccess(res, 201, 'Registration processed successfully', result);
  },

  getMyRegistrations: async (req, res) => {
    const result = await registrationsService.getStudentRegistrations(
      req.user.id,
      req.collegeId,
      req.query
    );
    return sendSuccess(res, 200, 'Student registrations retrieved successfully', result.data, result.meta);
  },

  getEventRegistrations: async (req, res) => {
    const result = await registrationsService.getEventRegistrations(
      req.params.eventId,
      req.collegeId,
      req.query
    );
    return sendSuccess(res, 200, 'Event registrations retrieved successfully', result.data, result.meta);
  }
};

module.exports = registrationsController;
