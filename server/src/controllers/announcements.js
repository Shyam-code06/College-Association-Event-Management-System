const announcementsService = require('../services/announcements');
const { sendSuccess } = require('../utils/response');

const announcementsController = {
  create: async (req, res) => {
    const announcement = await announcementsService.createAnnouncement(
      req.collegeId,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 201, 'Announcement posted successfully', announcement);
  },

  list: async (req, res) => {
    const result = await announcementsService.listAnnouncements(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Announcements retrieved successfully', result.data, result.meta);
  },

  getById: async (req, res) => {
    const announcement = await announcementsService.getAnnouncementById(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Announcement retrieved successfully', announcement);
  }
};

module.exports = announcementsController;
