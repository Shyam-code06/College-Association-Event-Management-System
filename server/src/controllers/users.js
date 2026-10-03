const usersService = require('../services/users');
const { sendSuccess } = require('../utils/response');

const usersController = {
  listCollegeUsers: async (req, res) => {
    const result = await usersService.listCollegeUsers(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Users retrieved successfully', result.data, result.meta);
  }
};

module.exports = usersController;
