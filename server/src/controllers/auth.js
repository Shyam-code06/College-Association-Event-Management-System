const authService = require('../services/auth');
const { sendSuccess } = require('../utils/response');

const authController = {
  register: async (req, res) => {
    const result = await authService.registerStudent(req.body);
    return sendSuccess(res, 201, 'Student registered successfully', result);
  },

  login: async (req, res) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, 200, 'Login successful', result);
  },

  getMe: async (req, res) => {
    const result = await authService.getMe(req.user.id);
    return sendSuccess(res, 200, 'Profile retrieved successfully', result);
  },

  changePassword: async (req, res) => {
    const result = await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, 200, result.message);
  },

  requestApproval: async (req, res) => {
    const result = await authService.requestApproval(req.body);
    return sendSuccess(res, 200, result.message, result);
  },

  checkCampus: async (req, res) => {
    const result = await authService.checkCampus(req.body);
    return sendSuccess(res, 200, 'Campus check complete', result);
  }
};

module.exports = authController;


