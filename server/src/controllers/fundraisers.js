const fundraisersService = require('../services/fundraisers');
const { sendSuccess } = require('../utils/response');

const fundraisersController = {
  createFundraiser: async (req, res) => {
    const fundraiser = await fundraisersService.createFundraiser(req.collegeId, req.user.id, req.body);
    return sendSuccess(res, 201, 'Fundraiser created successfully', fundraiser);
  },

  listFundraisers: async (req, res) => {
    const result = await fundraisersService.listFundraisers(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Fundraisers retrieved successfully', result.data, result.meta);
  },

  getFundraiserById: async (req, res) => {
    const fundraiser = await fundraisersService.getFundraiserById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Fundraiser retrieved successfully', fundraiser);
  },

  updateFundraiser: async (req, res) => {
    const updated = await fundraisersService.updateFundraiser(req.params.id, req.collegeId, req.body);
    return sendSuccess(res, 200, 'Fundraiser updated successfully', updated);
  },

  createTask: async (req, res) => {
    const task = await fundraisersService.createTask(req.collegeId, req.params.id, req.body);
    return sendSuccess(res, 201, 'Fundraiser task created and assigned successfully', task);
  },

  getStudentTasks: async (req, res) => {
    const result = await fundraisersService.getStudentTasks(req.user.id, req.collegeId, req.query);
    return sendSuccess(res, 200, 'Student tasks retrieved successfully', result.data, result.meta);
  },

  updateTaskStatus: async (req, res) => {
    const updated = await fundraisersService.updateTaskStatus(
      req.params.taskId,
      req.collegeId,
      req.user,
      req.body.status
    );
    return sendSuccess(res, 200, 'Task status updated successfully', updated);
  },

  listAvailableStudents: async (req, res) => {
    const students = await fundraisersService.listAvailableStudents(req.collegeId, req.query.eventId);
    return sendSuccess(res, 200, 'Students retrieved successfully', students);
  },

  respondToInvitation: async (req, res) => {
    const result = await fundraisersService.respondToInvitation(
      req.params.taskId,
      req.user.id,
      req.collegeId,
      req.body.action
    );
    return sendSuccess(
      res,
      200,
      `Volunteer invitation ${req.body.action}ed successfully`,
      result
    );
  }
};

module.exports = fundraisersController;
