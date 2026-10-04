const collegeAdminsService = require('../services/collegeAdmins');
const { sendSuccess } = require('../utils/response');

const collegeAdminsController = {
  create: async (req, res) => {
    const result = await collegeAdminsService.createCollegeAdminWithCollege(req.user.id, req.body);
    return sendSuccess(res, 201, 'College Admin and College created successfully', result);
  },

  list: async (req, res) => {
    const result = await collegeAdminsService.listCollegeAdmins(req.query);
    return sendSuccess(res, 200, 'College Admins retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const admin = await collegeAdminsService.getCollegeAdminById(req.params.id);
    return sendSuccess(res, 200, 'College Admin retrieved successfully', admin);
  },

  toggleAccess: async (req, res) => {
    const result = await collegeAdminsService.toggleAccess(req.params.id, req.body.isActive);
    return sendSuccess(res, 200, 'College Admin access status updated successfully', result);
  },

  softDelete: async (req, res) => {
    const result = await collegeAdminsService.softDeleteCollegeAdmin(req.params.id);
    return sendSuccess(res, 200, 'College Admin and College disabled successfully', result);
  },

  resetPassword: async (req, res) => {
    const result = await collegeAdminsService.resetPassword(req.params.id, req.body.newPassword);
    return sendSuccess(res, 200, result.message, result);
  }
};

module.exports = collegeAdminsController;
