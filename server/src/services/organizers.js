const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const organizersService = {
  /**
   * Creates a new Organizer within the authenticated College Admin's college.
   *
   * @param {number} collegeId
   * @param {number} adminId
   * @param {object} payload
   */
  createOrganizer: async (collegeId, adminId, { name, email, password }) => {
    const existing = await userModel.findByEmail(email);
    if (existing) {
      throw new AppError('A user with this email address already exists', 409);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const organizer = await userModel.create({
      college_id: collegeId,
      name,
      email,
      password_hash,
      role: ROLES.ORGANIZER,
      created_by: adminId,
      is_active: true
    });

    return {
      id: organizer.id,
      collegeId: organizer.college_id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
      isActive: Boolean(organizer.is_active),
      createdAt: organizer.created_at
    };
  },

  /**
   * Lists all organizers belonging to the authenticated college.
   *
   * @param {number} collegeId
   * @param {object} queryParams
   */
  listOrganizers: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      search: queryParams.search,
      isActive: queryParams.isActive !== undefined ? queryParams.isActive === 'true' : undefined,
      offset,
      limit
    };

    const organizers = await userModel.findAllOrganizers(collegeId, filters);
    const total = await userModel.countOrganizers(collegeId, filters);

    const formatted = organizers.map((org) => ({
      id: org.id,
      collegeId: org.college_id,
      name: org.name,
      email: org.email,
      role: org.role,
      isActive: Boolean(org.is_active),
      createdAt: org.created_at,
      deletedAt: org.deleted_at
    }));

    return {
      data: formatted,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single organizer by ID strictly within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   */
  getOrganizerById: async (id, collegeId) => {
    const org = await userModel.findById(id, collegeId);
    if (!org || org.role !== ROLES.ORGANIZER) {
      throw new AppError('Organizer not found', 404);
    }

    return {
      id: org.id,
      collegeId: org.college_id,
      name: org.name,
      email: org.email,
      role: org.role,
      isActive: Boolean(org.is_active),
      createdAt: org.created_at,
      deletedAt: org.deleted_at
    };
  },

  /**
   * Updates an organizer's name/email within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   * @param {object} updateData
   */
  updateOrganizer: async (id, collegeId, updateData) => {
    const org = await userModel.findById(id, collegeId);
    if (!org || org.role !== ROLES.ORGANIZER) {
      throw new AppError('Organizer not found', 404);
    }

    const payload = {};
    if (updateData.name) payload.name = updateData.name;
    if (updateData.email && updateData.email !== org.email) {
      const existing = await userModel.findByEmail(updateData.email);
      if (existing) {
        throw new AppError('Email address is already in use by another account', 409);
      }
      payload.email = updateData.email;
    }

    const updated = await userModel.update(id, payload, collegeId);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      isActive: Boolean(updated.is_active)
    };
  },

  /**
   * Activates or deactivates an organizer within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   * @param {boolean} isActive
   */
  toggleOrganizerAccess: async (id, collegeId, isActive) => {
    const org = await userModel.findById(id, collegeId);
    if (!org || org.role !== ROLES.ORGANIZER) {
      throw new AppError('Organizer not found', 404);
    }

    const updated = await userModel.update(id, { is_active: isActive }, collegeId);
    return {
      id: updated.id,
      name: updated.name,
      isActive: Boolean(updated.is_active)
    };
  },

  /**
   * Soft deletes an organizer within the college.
   *
   * @param {number} id
   * @param {number} collegeId
   */
  softDeleteOrganizer: async (id, collegeId) => {
    const org = await userModel.findById(id, collegeId);
    if (!org || org.role !== ROLES.ORGANIZER) {
      throw new AppError('Organizer not found', 404);
    }

    const deleted = await userModel.softDelete(id, collegeId);
    return {
      id: deleted.id,
      isDeleted: true
    };
  }
};

module.exports = organizersService;
