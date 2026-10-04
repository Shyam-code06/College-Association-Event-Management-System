const db = require('../config/database');
const { applyTenantScope } = require('../utils/tenantScope');
const { MEMBERSHIP_STATUS, DUES_STATUS } = require('../constants/statuses');

const membershipModel = {
  // --- Membership Plans ---
  findPlanById: async (id, collegeId, trx = db) => {
    let query = trx('membership_plans').where('id', id);
    query = applyTenantScope(query, collegeId);
    return query.first();
  },

  findAllPlans: async (collegeId, options = {}, trx = db) => {
    let query = trx('membership_plans');
    query = applyTenantScope(query, collegeId);

    if (options.role === 'student') {
      query = query.where('is_active', true).where('approval_status', 'approved');
    } else if (options.role === 'organizer' && options.userEmail) {
      const email = options.userEmail.toLowerCase().trim();
      query = query.where(function () {
        this.where('created_by', options.userId)
          .orWhere('assigned_organizers', 'like', `%${email}%`)
          .orWhere(function () {
            this.where('is_active', true).where('approval_status', 'approved');
          });
      });
    }

    if (options.status) {
      query = query.where('approval_status', options.status);
    }

    const plans = await query.orderBy('fee', 'asc');
    return plans.map((p) => {
      let assigned = [];
      if (p.assigned_organizers) {
        try {
          assigned = typeof p.assigned_organizers === 'string' ? JSON.parse(p.assigned_organizers) : p.assigned_organizers;
        } catch {
          assigned = p.assigned_organizers.split(',').map((s) => s.trim());
        }
      }
      return {
        ...p,
        assigned_organizers: Array.isArray(assigned) ? assigned : [assigned]
      };
    });
  },

  createPlan: async (collegeId, planData, trx = db) => {
    const payload = { ...planData };
    if (Array.isArray(payload.assigned_organizers)) {
      payload.assigned_organizers = JSON.stringify(payload.assigned_organizers);
    }
    const [id] = await trx('membership_plans').insert({
      college_id: collegeId,
      ...payload
    });
    return trx('membership_plans').where({ id, college_id: collegeId }).first();
  },

  updatePlan: async (id, collegeId, updateData, trx = db) => {
    const payload = { ...updateData };
    if (Array.isArray(payload.assigned_organizers)) {
      payload.assigned_organizers = JSON.stringify(payload.assigned_organizers);
    }
    let query = trx('membership_plans').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(payload);
    return trx('membership_plans').where({ id, college_id: collegeId }).first();
  },

  // --- User Memberships ---
  createMembership: async (collegeId, data, trx = db) => {
    const [id] = await trx('memberships').insert({
      college_id: collegeId,
      ...data
    });
    return trx('memberships').where({ id, college_id: collegeId }).first();
  },

  findById: async (id, collegeId, trx = db) => {
    let query = trx('memberships')
      .select('memberships.*', 'membership_plans.name as plan_name', 'membership_plans.fee as plan_fee')
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.id', id);

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.first();
  },

  findByUserId: async (userId, collegeId, trx = db) => {
    let query = trx('memberships')
      .select(
        'memberships.*',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.organization',
        'membership_plans.merch_discount_percent',
        'membership_plans.ticket_discount_note'
      )
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.user_id', userId);

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('memberships.created_at', 'desc').first();
  },

  findByUserIdAndPlan: async (userId, planId, collegeId, trx = db) => {
    let query = trx('memberships')
      .select(
        'memberships.*',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.organization',
        'membership_plans.merch_discount_percent',
        'membership_plans.ticket_discount_note'
      )
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.user_id', userId)
      .where('memberships.plan_id', planId);

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('memberships.created_at', 'desc').first();
  },

  findAllByUserId: async (userId, collegeId, trx = db) => {
    let query = trx('memberships')
      .select(
        'memberships.*',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.organization',
        'membership_plans.merch_discount_percent',
        'membership_plans.ticket_discount_note'
      )
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.user_id', userId);

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('memberships.created_at', 'desc');
  },

  getAllActiveMemberships: async (userId, collegeId, trx = db) => {
    const today = new Date().toISOString().split('T')[0];
    let query = trx('memberships')
      .select(
        'memberships.*',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.organization',
        'membership_plans.merch_discount_percent',
        'membership_plans.ticket_discount_note'
      )
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.user_id', userId)
      .whereIn('memberships.status', ['active', 'ACTIVE'])
      .whereIn('memberships.dues_status', ['paid', 'PAID'])
      .where(function () {
        this.whereNull('memberships.expiry_date').orWhere('memberships.expiry_date', '>=', today);
      });

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('membership_plans.merch_discount_percent', 'desc');
  },

  getActiveMembership: async (userId, collegeId, trx = db) => {
    const today = new Date().toISOString().split('T')[0];
    let query = trx('memberships')
      .select(
        'memberships.*',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.organization',
        'membership_plans.merch_discount_percent',
        'membership_plans.ticket_discount_note'
      )
      .leftJoin('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.user_id', userId)
      .whereIn('memberships.status', ['active', 'ACTIVE'])
      .whereIn('memberships.dues_status', ['paid', 'PAID'])
      .where(function () {
        this.whereNull('memberships.expiry_date').orWhere('memberships.expiry_date', '>=', today);
      });

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('membership_plans.merch_discount_percent', 'desc').first();
  },

  deleteMembership: async (id, collegeId, trx = db) => {
    // Clean up any related payments first
    await trx('payments')
      .where({ payable_type: 'membership', payable_id: id })
      .del();

    let query = trx('memberships').where('id', id);
    query = applyTenantScope(query, collegeId);
    return query.del();
  },

  findAllMembers: async (collegeId, { status, search, organization, planId, cancellationStatus, offset = 0, limit = 10 }, trx = db) => {
    let query = trx('memberships')
      .select(
        'memberships.id',
        'memberships.college_id',
        'memberships.user_id',
        'memberships.plan_id',
        'memberships.organization',
        'memberships.status',
        'memberships.dues_status',
        'memberships.start_date',
        'memberships.expiry_date',
        'memberships.cancellation_status',
        'memberships.cancellation_reason',
        'memberships.cancellation_requested_at',
        'memberships.cancellation_reviewed_by',
        'memberships.cancellation_reviewed_at',
        'memberships.cancellation_review_note',
        'memberships.created_at',
        'users.name as user_name',
        'users.name as student_name',
        'users.email as user_email',
        'users.email as student_email',
        'membership_plans.name as plan_name',
        'membership_plans.fee as plan_fee',
        'membership_plans.merch_discount_percent'
      )
      .join('users', 'memberships.user_id', 'users.id')
      .join('membership_plans', 'memberships.plan_id', 'membership_plans.id');

    query = applyTenantScope(query, collegeId, 'memberships');

    if (status) {
      query = query.where('memberships.status', status);
    }

    if (planId) {
      query = query.where('memberships.plan_id', planId);
    }

    if (cancellationStatus) {
      query = query.where('memberships.cancellation_status', cancellationStatus);
    }

    if (organization) {
      query = query.where('memberships.organization', organization);
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('memberships.organization', 'like', `%${search}%`)
          .orWhere('membership_plans.name', 'like', `%${search}%`);
      });
    }

    return query.orderBy('memberships.created_at', 'desc').offset(offset).limit(limit);
  },

  countMembers: async (collegeId, { status, search, organization, planId, cancellationStatus }, trx = db) => {
    let query = trx('memberships')
      .join('users', 'memberships.user_id', 'users.id')
      .join('membership_plans', 'memberships.plan_id', 'membership_plans.id');

    query = applyTenantScope(query, collegeId, 'memberships');

    if (status) {
      query = query.where('memberships.status', status);
    }

    if (planId) {
      query = query.where('memberships.plan_id', planId);
    }

    if (cancellationStatus) {
      query = query.where('memberships.cancellation_status', cancellationStatus);
    }

    if (organization) {
      query = query.where('memberships.organization', organization);
    }

    if (search) {
      query = query.where((q) => {
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('memberships.organization', 'like', `%${search}%`)
          .orWhere('membership_plans.name', 'like', `%${search}%`);
      });
    }

    const result = await query.count('memberships.id as count').first();
    return parseInt(result.count, 10);
  },

  verifyMemberStatus: async (collegeId, queryValue, trx = db) => {
    let query = trx('memberships')
      .select(
        'memberships.id',
        'memberships.college_id',
        'memberships.status',
        'memberships.dues_status',
        'memberships.start_date',
        'memberships.expiry_date',
        'users.id as user_id',
        'users.name as user_name',
        'users.email as user_email',
        'membership_plans.name as plan_name'
      )
      .join('users', 'memberships.user_id', 'users.id')
      .join('membership_plans', 'memberships.plan_id', 'membership_plans.id');

    query = applyTenantScope(query, collegeId, 'memberships');

    if (!isNaN(queryValue)) {
      query = query.where((q) => {
        q.where('users.id', queryValue).orWhere('users.email', queryValue);
      });
    } else {
      query = query.where('users.email', queryValue);
    }

    return query.orderBy('memberships.created_at', 'desc').first();
  },

  updateMembership: async (id, collegeId, data, trx = db) => {
    let query = trx('memberships').where('id', id);
    query = applyTenantScope(query, collegeId);
    await query.update(data);
    return trx('memberships').where({ id, college_id: collegeId }).first();
  },

  findExpiringMemberships: async (daysThreshold = 7, trx = db) => {
    // Find active memberships expiring in target days where reminder was not sent
    return trx('memberships')
      .select('memberships.*', 'users.email', 'users.name')
      .join('users', 'memberships.user_id', 'users.id')
      .where('memberships.status', MEMBERSHIP_STATUS.ACTIVE)
      .whereNull('memberships.reminder_sent_at')
      .whereRaw('DATEDIFF(memberships.expiry_date, CURDATE()) <= ? AND DATEDIFF(memberships.expiry_date, CURDATE()) >= 0', [daysThreshold]);
  },

  findExpiredActiveMemberships: async (trx = db) => {
    return trx('memberships')
      .where('status', MEMBERSHIP_STATUS.ACTIVE)
      .whereRaw('expiry_date < CURDATE()');
  },

  findActiveMembersByCollege: async (collegeId, trx = db) => {
    const today = new Date().toISOString().split('T')[0];
    let query = trx('memberships')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'membership_plans.name as plan_name'
      )
      .join('users', 'memberships.user_id', 'users.id')
      .join('membership_plans', 'memberships.plan_id', 'membership_plans.id')
      .where('memberships.status', MEMBERSHIP_STATUS.ACTIVE)
      .where('memberships.dues_status', DUES_STATUS.PAID)
      .where(function () {
        this.whereNull('memberships.expiry_date').orWhere('memberships.expiry_date', '>=', today);
      })
      .where('users.is_active', true)
      .whereNull('users.deleted_at');

    query = applyTenantScope(query, collegeId, 'memberships');
    return query.orderBy('users.name', 'asc');
  }
};

module.exports = membershipModel;
