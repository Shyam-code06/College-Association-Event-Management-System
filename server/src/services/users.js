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
  },

  /**
   * Activates or deactivates a user (student/organizer) within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   * @param {boolean} isActive
   */
  toggleUserStatus: async (id, collegeId, isActive) => {
    const user = await userModel.findById(id, collegeId);
    if (!user) {
      const AppError = require('../utils/appError');
      throw new AppError('User not found', 404);
    }

    const newStatus = typeof isActive === 'boolean' ? isActive : !user.is_active;
    const updated = await userModel.update(id, { is_active: newStatus }, collegeId);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: Boolean(updated.is_active)
    };
  },

  /**
   * Soft deletes a user (student or organizer) within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   */
  deleteUser: async (id, collegeId) => {
    const user = await userModel.findById(id, collegeId);
    if (!user) {
      const AppError = require('../utils/appError');
      throw new AppError('User not found', 404);
    }

    const { ROLES } = require('../constants/roles');
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.COLLEGE_ADMIN) {
      const AppError = require('../utils/appError');
      throw new AppError('Administrative users cannot be deleted through this endpoint', 403);
    }

    await userModel.softDelete(id, collegeId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isDeleted: true
    };
  },

  /**
   * Approves (activates) all pending users in the college, optionally filtered by role.
   *
   * @param {number} collegeId
   * @param {string} [role]
   */
  approveAllUsers: async (collegeId, role = null) => {
    const updatedCount = await userModel.approveAllPending(collegeId, role);
    return {
      updatedCount
    };
  }
};

module.exports = usersService;

