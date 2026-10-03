const usersService = require('../services/users');
const { sendSuccess } = require('../utils/response');

const usersController = {
  listCollegeUsers: async (req, res) => {
    const result = await usersService.listCollegeUsers(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Users retrieved successfully', result.data, result.meta);
  },

  toggleUserStatus: async (req, res) => {
    const result = await usersService.toggleUserStatus(req.params.id, req.collegeId, req.body.isActive);
    return sendSuccess(res, 200, 'User status updated successfully', result);
  },

  deleteUser: async (req, res) => {
    const result = await usersService.deleteUser(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'User account deleted successfully', result);
  },

  approveAllUsers: async (req, res) => {
    const result = await usersService.approveAllUsers(req.collegeId, req.body.role);
    return sendSuccess(res, 200, 'All pending accounts approved successfully', result);
  }
};

module.exports = usersController;

