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
    const name = eventData.name || eventData.title;
    const location = eventData.location || eventData.venue;
    const isPaid = Boolean(eventData.is_paid || (eventData.price && Number(eventData.price) > 0));
    const regularPrice = eventData.non_member_price !== undefined ? parseFloat(eventData.non_member_price) : (eventData.price !== undefined ? parseFloat(eventData.price) : 0);
    const nonMemberPrice = isPaid ? regularPrice : 0;
    const memberPrice = isPaid ? parseFloat(eventData.member_price || 0) : 0;
    
    let eventDate = eventData.event_date;
    let startTime = eventData.start_time || '10:00:00';
    if (typeof eventDate === 'string') {
      if (eventDate.includes('T')) {
        const parts = eventDate.split('T');
        eventDate = parts[0];
        if (parts[1] && !eventData.start_time) {
          startTime = parts[1].substring(0, 8);
          if (startTime.length === 5) startTime += ':00';
        }
      }
    }

    if (isPaid && nonMemberPrice <= 0) {
      throw new AppError('Paid events must specify a valid non-member price greater than 0', 400);
    }

    const createdEvent = await db.transaction(async (trx) => {
      return eventModel.create(
        collegeId,
        {
          name,
          description: eventData.description || null,
          event_date: eventDate,
          start_time: startTime,
          location,
          capacity: parseInt(eventData.capacity, 10),
          is_paid: isPaid,
          member_price: memberPrice,
          non_member_price: nonMemberPrice,
          status: eventData.status || 'published',
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
   * Organizers and College Admins can edit college events.
   */
  updateEvent: async (id, collegeId, user, updateData) => {
    const event = await eventModel.findById(id, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const cleanData = {};
    if (updateData.name || updateData.title) {
      cleanData.name = updateData.name || updateData.title;
    }
    if (updateData.description !== undefined) {
      cleanData.description = updateData.description;
    }
    if (updateData.location || updateData.venue) {
      cleanData.location = updateData.location || updateData.venue;
    }
    if (updateData.capacity !== undefined) {
      cleanData.capacity = parseInt(updateData.capacity, 10);
    }
    if (updateData.event_date) {
      let eventDate = updateData.event_date;
      if (typeof eventDate === 'string' && eventDate.includes('T')) {
        const parts = eventDate.split('T');
        cleanData.event_date = parts[0];
        if (parts[1] && !updateData.start_time) {
          cleanData.start_time = parts[1].substring(0, 8);
          if (cleanData.start_time.length === 5) cleanData.start_time += ':00';
        }
      } else {
        cleanData.event_date = eventDate;
      }
    }
    if (updateData.start_time) {
      cleanData.start_time = updateData.start_time;
      if (cleanData.start_time.length === 5) cleanData.start_time += ':00';
    }

    if (updateData.non_member_price !== undefined || updateData.price !== undefined) {
      cleanData.non_member_price = parseFloat(updateData.non_member_price ?? updateData.price ?? 0);
      cleanData.is_paid = cleanData.non_member_price > 0;
    }
    if (updateData.member_price !== undefined) {
      cleanData.member_price = parseFloat(updateData.member_price);
    }
    if (updateData.is_paid !== undefined) {
      cleanData.is_paid = Boolean(updateData.is_paid);
    }
    if (updateData.status) {
      cleanData.status = updateData.status;
    }

    return eventModel.update(id, collegeId, cleanData);
  },

  /**
   * Cancels an event.
   * Organizers and College Admins can cancel college events.
   */
  cancelEvent: async (id, collegeId, user) => {
    const event = await eventModel.findById(id, collegeId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return eventModel.update(id, collegeId, { status: 'cancelled' });
  }
};

module.exports = eventsService;
