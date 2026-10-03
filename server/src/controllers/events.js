const eventsService = require('../services/events');
const { sendSuccess } = require('../utils/response');

const eventsController = {
  create: async (req, res) => {
    const event = await eventsService.createEvent(req.collegeId, req.user.id, req.body);
    return sendSuccess(res, 201, 'Event created successfully and notifications queued', event);
  },

  list: async (req, res) => {
    const result = await eventsService.listEvents(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Events retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const event = await eventsService.getEventById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Event retrieved successfully', event);
  },

  update: async (req, res) => {
    const updated = await eventsService.updateEvent(req.params.id, req.collegeId, req.user, req.body);
    return sendSuccess(res, 200, 'Event updated successfully', updated);
  },

  cancel: async (req, res) => {
    const cancelled = await eventsService.cancelEvent(req.params.id, req.collegeId, req.user);
    return sendSuccess(res, 200, 'Event cancelled successfully', cancelled);
  }
};

module.exports = eventsController;
