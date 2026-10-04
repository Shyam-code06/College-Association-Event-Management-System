const announcementModel = require('../models/announcement');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const AppError = require('../utils/appError');

const announcementsService = {
  /**
   * Creates an immutable announcement.
   * Usable by College Admin or Organizer.
   *
   * @param {number} collegeId
   * @param {number} authorId
   * @param {object} payload - { title, message }
   */
  createAnnouncement: async (collegeId, authorId, payload) => {
    const title = payload.title?.trim();
    const message = (payload.message || payload.content)?.trim();
    const priority = payload.priority || 'INFO';

    return announcementModel.create(collegeId, {
      title,
      message,
      priority,
      posted_by: authorId
    });
  },

  /**
   * Lists college announcements in reverse chronological order.
   * Usable by students, organizers, and college admin.
   *
   * @param {number} collegeId
   * @param {object} queryParams
   */
  listAnnouncements: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const announcements = await announcementModel.findAll(collegeId, { offset, limit });
    const total = await announcementModel.count(collegeId);

    const formatted = announcements.map((a) => ({
      id: a.id,
      collegeId: a.college_id,
      title: a.title,
      message: a.message,
      content: a.message,
      priority: a.priority || 'INFO',
      author: {
        id: a.posted_by,
        name: a.author_name,
        role: a.author_role
      },
      createdAt: a.created_at,
      created_at: a.created_at
    }));

    return {
      data: formatted,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single announcement by ID.
   */
  getAnnouncementById: async (id, collegeId) => {
    const announcement = await announcementModel.findById(id, collegeId);
    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }
    return announcement;
  }
};

module.exports = announcementsService;
