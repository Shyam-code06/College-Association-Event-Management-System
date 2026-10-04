const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { REGISTRATION_STATUS } = require('../constants/statuses');

const registrationModel = {
  create: async (collegeId, data, trx = db) => {
    const [id] = await trx('registrations').insert({
      college_id: collegeId,
      ...data
    });
    return trx('registrations').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('registrations')
      .select('registrations.*', 'events.name as event_name', 'events.event_date', 'events.is_paid')
      .leftJoin('events', 'registrations.event_id', 'events.id')
      .where('registrations.id', id);

    query = applyTenantScope(query, collegeId, 'registrations');
    return query.first();
  },

  findByEventAndUser: async (eventId, userId, collegeId, trx = db) => {
    let query = trx('registrations')
      .where({
        event_id: eventId,
        user_id: userId
      });

    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findByQrToken: async (qrToken, collegeId, trx = db) => {
    const raw = String(qrToken || '').trim();
    const numericStr = raw.startsWith('#') ? raw.slice(1) : raw;
    const isNumeric = /^\d+$/.test(numericStr);

    let query = trx('registrations')
      .select(
        'registrations.*',
        'events.name as event_name',
        'events.is_paid',
        'users.name as user_name',
        'users.email as user_email'
      )
      .join('events', 'registrations.event_id', 'events.id')
      .join('users', 'registrations.user_id', 'users.id');

    if (isNumeric) {
      query = query.where((qb) => {
        qb.where('registrations.qr_token', raw)
          .orWhere('registrations.id', parseInt(numericStr, 10));
      });
    } else {
      query = query.where('registrations.qr_token', raw);
    }

    query = applyTenantScope(query, collegeId, 'registrations');
    return query.first();
  },

  update: async (id, collegeId, data, trx = db) => {
    let query = trx('registrations').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(data);
    return trx('registrations').where({ id, college_id: collegeId }).first();
  },

  // Atomic check-in update to prevent race conditions on double scans
  atomicCheckIn: async (id, collegeId, organizerId, trx = db) => {
    let query = trx('registrations')
      .where('id', id)
      .whereNull('checked_in_at');

    query = applyTenantScope(query, collegeId);

    const affected = await query.update({
      checked_in_at: trx.fn.now(),
      checked_in_by: organizerId
    });

    return affected > 0;
  },

  findStudentRegistrations: async (userId, collegeId, { offset = 0, limit = 10 }, trx = db) => {
    let query = trx('registrations')
      .select(
        'registrations.*',
        'events.name as event_name',
        'events.event_date',
        'events.start_time',
        'events.location',
        'events.is_paid'
      )
      .join('events', 'registrations.event_id', 'events.id')
      .where('registrations.user_id', userId);

    query = applyTenantScope(query, collegeId, 'registrations');
    return query.orderBy('registrations.created_at', 'desc').offset(offset).limit(limit);
  },

  countStudentRegistrations: async (userId, collegeId, trx = db) => {
    let query = trx('registrations').where('user_id', userId);
    query = applyTenantScope(query, collegeId);
    const result = await query.count('id as count').first();
    return parseInt(result.count, 10);
  },

  findEventRegistrations: async (eventId, collegeId, { status, offset = 0, limit = 20 }, trx = db) => {
    let query = trx('registrations')
      .select(
        'registrations.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .join('users', 'registrations.user_id', 'users.id')
      .where('registrations.event_id', eventId);

    query = applyTenantScope(query, collegeId, 'registrations');

    if (status) {
      query = query.where('registrations.status', status);
    }

    const rows = await query.orderBy('registrations.created_at', 'asc').offset(offset).limit(limit);
    return rows.map((r) => ({
      ...r,
      checked_in: Boolean(r.checked_in_at),
      check_in_time: r.checked_in_at
    }));
  },

  getEventReportStats: async (eventId, collegeId, trx = db) => {
    let baseQuery = trx('registrations').where('event_id', eventId);
    baseQuery = applyTenantScope(baseQuery, collegeId);

    const totalRegistrations = await baseQuery.clone()
      .whereIn('status', [REGISTRATION_STATUS.CONFIRMED, REGISTRATION_STATUS.RESERVED])
      .count('id as count')
      .first();

    const confirmedRegistrations = await baseQuery.clone()
      .where('status', REGISTRATION_STATUS.CONFIRMED)
      .count('id as count')
      .first();

    const attendees = await baseQuery.clone()
      .whereNotNull('checked_in_at')
      .count('id as count')
      .first();

    const memberAttendees = await baseQuery.clone()
      .whereNotNull('checked_in_at')
      .where('is_member_at_registration', true)
      .count('id as count')
      .first();

    const nonMemberAttendees = await baseQuery.clone()
      .whereNotNull('checked_in_at')
      .where('is_member_at_registration', false)
      .count('id as count')
      .first();

    const revenueResult = await baseQuery.clone()
      .where('status', REGISTRATION_STATUS.CONFIRMED)
      .sum('price_charged as totalRevenue')
      .first();

    return {
      totalRegistrations: parseInt(totalRegistrations.count, 10) || 0,
      confirmedRegistrations: parseInt(confirmedRegistrations.count, 10) || 0,
      attendees: parseInt(attendees.count, 10) || 0,
      memberAttendees: parseInt(memberAttendees.count, 10) || 0,
      nonMemberAttendees: parseInt(nonMemberAttendees.count, 10) || 0,
      ticketRevenue: parseFloat(revenueResult.totalRevenue || 0)
    };
  },

  findExpiredReservations: async (minutes = 15, trx = db) => {
    return trx('registrations')
      .where('status', REGISTRATION_STATUS.RESERVED)
      .whereRaw(`created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`, [minutes]);
  }
};

module.exports = registrationModel;
