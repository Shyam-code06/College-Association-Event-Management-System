const db = require('../config/database');
const eventModel = require('../models/event');
const emailService = require('./email');
const { ROLES } = require('../constants/roles');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const eventsService = {
  /**
   * Creates an event within the college and asynchronously dispatches email notification to active students.
   *
   * @param {number} collegeId
   * @param {number} creatorId
   * @param {object} eventData
   */
  createEvent: async (collegeId, creatorId, eventData) => {
    const isPaid = Boolean(eventData.is_paid);
    const memberPrice = isPaid ? parseFloat(eventData.member_price || 0) : 0;
    const nonMemberPrice = isPaid ? parseFloat(eventData.non_member_price || 0) : 0;
    const eventDate = typeof eventData.event_date === 'string' ? eventData.event_date.split('T')[0] : eventData.event_date;

    if (isPaid && nonMemberPrice <= 0) {
      throw new AppError('Paid events must specify a valid non-member price greater than 0', 400);
    }

    const createdEvent = await db.transaction(async (trx) => {
      return eventModel.create(
        collegeId,
        {
          ...eventData,
          event_date: eventDate,
          is_paid: isPaid,
          member_price: memberPrice,
          non_member_price: nonMemberPrice,
          created_by: creatorId
        },
        trx
      );
    });

    // Fire email notifications asynchronously to all active students of this college
    // Does not block the HTTP response!
    emailService.sendEventNotificationAsync(collegeId, {
      name: createdEvent.name,
      description: createdEvent.description,
      event_date: createdEvent.event_date,
      start_time: createdEvent.start_time,
      location: createdEvent.location,
      capacity: createdEvent.capacity,
      member_price: createdEvent.member_price,
      non_member_price: createdEvent.non_member_price
    });

    return createdEvent;
  },

  /**
   * Lists events within the college with live available seats.
   */
  listEvents: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      status: queryParams.status,
      upcomingOnly: queryParams.upcomingOnly === 'true',
      search: queryParams.search,
      offset,
      limit
    };

    const events = await eventModel.findAll(collegeId, filters);
    const total = await eventModel.count(collegeId, filters);

    return {
      data: events,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Retrieves single event by ID with available seats.
   */
  getEventById: async (id, collegeId) => {
    const event = await eventModel.findById(id, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const availableSeats = await eventModel.getAvailableSeats(event.id, event.capacity, collegeId);

    return {
      ...event,
      available_seats: availableSeats
    };
  },

  /**
   * Updates an event within the college.
   * Organizers can only edit events they created; College Admins can edit any.
   */
  updateEvent: async (id, collegeId, user, updateData) => {
    const event = await eventModel.findById(id, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (user.role === ROLES.ORGANIZER && event.created_by !== user.id) {
      throw new AppError('Organizers can only edit events they created', 403);
    }

    return eventModel.update(id, collegeId, updateData);
  },

  /**
   * Cancels an event.
   * Organizers can only cancel events they created; College Admins can cancel any.
   */
  cancelEvent: async (id, collegeId, user) => {
    const event = await eventModel.findById(id, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (user.role === ROLES.ORGANIZER && event.created_by !== user.id) {
      throw new AppError('Organizers can only cancel events they created', 403);
    }

    return eventModel.cancel(id, collegeId);
  }
};

module.exports = eventsService;
