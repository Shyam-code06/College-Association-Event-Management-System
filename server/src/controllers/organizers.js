const organizersService = require('../services/organizers');
const { sendSuccess } = require('../utils/response');

const organizersController = {
  create: async (req, res) => {
    const result = await organizersService.createOrganizer(req.collegeId, req.user.id, req.body);
    return sendSuccess(res, 201, 'Organizer created successfully', result);
  },

  list: async (req, res) => {
    const result = await organizersService.listOrganizers(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Organizers retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const organizer = await organizersService.getOrganizerById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Organizer retrieved successfully', organizer);
  },

  update: async (req, res) => {
    const updated = await organizersService.updateOrganizer(req.params.id, req.collegeId, req.body);
    return sendSuccess(res, 200, 'Organizer updated successfully', updated);
  },

  toggleAccess: async (req, res) => {
    const updated = await organizersService.toggleOrganizerAccess(req.params.id, req.collegeId, req.body.isActive);
    return sendSuccess(res, 200, 'Organizer access updated successfully', updated);
  },

  softDelete: async (req, res) => {
    const result = await organizersService.softDeleteOrganizer(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Organizer deleted successfully', result);
  }
};

module.exports = organizersController;
