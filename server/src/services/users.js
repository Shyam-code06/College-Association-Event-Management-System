const userModel = require('../models/user');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const usersService = {
  /**
   * Lists users belonging to the college with optional role and search filters.
   *
   * @param {number} collegeId
   * @param {object} queryParams
   */
  listCollegeUsers: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      role: queryParams.role,
      search: queryParams.search,
      offset,
      limit
    };

    const users = await userModel.findCollegeUsers(collegeId, filters);
    const total = await userModel.countCollegeUsers(collegeId, filters);

    const formatted = users.map((u) => ({
      id: u.id,
      collegeId: u.college_id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: Boolean(u.is_active),
      createdAt: u.created_at
    }));

    return {
      data: formatted,
      meta: buildPaginationMeta(total, page, limit)
    };
  }
};

module.exports = usersService;
