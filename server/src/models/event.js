const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { EVENT_STATUS, REGISTRATION_STATUS } = require('../constants/statuses');

const eventModel = {
  create: async (collegeId, eventData, trx = db) => {
    const [id] = await trx('events').insert({
      college_id: collegeId,
      ...eventData
    });
    return trx('events').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    try {
      await trx('events')
        .where('id', id)
        .where('college_id', collegeId)
        .where('status', EVENT_STATUS.PUBLISHED)
        .where('event_date', '<', trx.fn.now())
        .update({ status: EVENT_STATUS.COMPLETED });
    } catch (e) {
      // Ignore
    }

    let query = trx('events')
      .select(
        'events.*',
        'events.name as title',
        'events.location as venue',
        'events.non_member_price as price',
        'users.name as creator_name',
        'users.email as creator_email'
      )
      .leftJoin('users', 'events.created_by', 'users.id')
      .where('events.id', id);

    query = applyTenantScope(query, collegeId, 'events');
    return query.first();
  },

  findByIdForUpdate: async (id, collegeId, trx) => {
    let query = trx('events')
      .where('id', id);

    query = applyTenantScope(query, collegeId);
    return query.forUpdate().first();
  },

  getAvailableSeats: async (eventId, capacity, collegeId, trx = db) => {
    let query = trx('registrations')
      .where({ event_id: eventId })
      .whereIn('status', [REGISTRATION_STATUS.RESERVED, REGISTRATION_STATUS.CONFIRMED]);

    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as registeredCount').first();
    const count = parseInt(result.registeredCount, 10) || 0;
    return Math.max(0, capacity - count);
  },

  findAll: async (collegeId, { status, upcomingOnly = false, search, offset = 0, limit = 10 }, trx = db) => {
    try {
      await trx('events')
        .where('college_id', collegeId)
        .where('status', EVENT_STATUS.PUBLISHED)
        .where('event_date', '<', trx.fn.now())
        .update({ status: EVENT_STATUS.COMPLETED });
    } catch (e) {
      // Ignore
    }

    let query = trx('events')

      .select(
        'events.*',
        'events.name as title',
        'events.location as venue',
        'events.non_member_price as price',
        'users.name as creator_name',
        'users.email as creator_email',
        trx.raw(`
          (events.capacity - (
            SELECT COUNT(*) FROM registrations
            WHERE registrations.event_id = events.id
            AND registrations.status IN ('${REGISTRATION_STATUS.RESERVED}', '${REGISTRATION_STATUS.CONFIRMED}')
          )) as available_seats
        `)
      )
      .leftJoin('users', 'events.created_by', 'users.id');

    query = applyTenantScope(query, collegeId, 'events');

    if (status) {
      query = query.where('events.status', status);
    }

    if (upcomingOnly) {
      query = query.where('events.event_date', '>=', trx.fn.now());
    }

    if (search) {
      query = query.where((q) => {
        q.where('events.name', 'like', `%${search}%`)
          .orWhere('events.location', 'like', `%${search}%`);
      });
    }

    return query.orderBy('events.event_date', 'asc').offset(offset).limit(limit);
  },

  count: async (collegeId, { status, upcomingOnly = false, search }, trx = db) => {
    let query = trx('events');
    query = applyTenantScope(query, collegeId);

    if (status) {
      query = query.where('status', status);
    }

    if (upcomingOnly) {
      query = query.where('event_date', '>=', trx.fn.now());
    }

    if (search) {
      query = query.where((q) => {
        q.where('name', 'like', `%${search}%`)
          .orWhere('location', 'like', `%${search}%`);
      });
    }

    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  update: async (id, collegeId, updateData, trx = db) => {
    let query = trx('events').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(updateData);
    return trx('events').where({ id, college_id: collegeId }).first();
  },

  cancel: async (id, collegeId, trx = db) => {
    let query = trx('events').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update({ status: EVENT_STATUS.CANCELLED });
    return trx('events').where({ id, college_id: collegeId }).first();
  }
};

module.exports = eventModel;
