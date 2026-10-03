const db = require('../config/database');
const membershipModel = require('../models/membership');
const paymentModel = require('../models/payment');
const { generateTransactionRef } = require('./mockPayment');
const { MEMBERSHIP_STATUS, DUES_STATUS, PAYMENT_STATUS, PAYABLE_TYPE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const membershipsService = {
  /**
   * Creates a new membership plan for the college.
   */
  createPlan: async (collegeId, planData) => {
    return membershipModel.createPlan(collegeId, planData);
  },

  /**
   * Lists all active membership plans for the college.
   */
  listPlans: async (collegeId) => {
    return membershipModel.findAllPlans(collegeId);
  },

  /**
   * Updates an existing membership plan within the college.
   */
  updatePlan: async (id, collegeId, updateData) => {
    const plan = await membershipModel.findPlanById(id, collegeId);
    if (!plan) {
      throw new AppError('Membership plan not found', 404);
    }
    return membershipModel.updatePlan(id, collegeId, updateData);
  },

  /**
   * Student initiates membership join.
   * If fee is 0, activates immediately. If paid, creates pending payment.
   */
  joinMembership: async (userId, collegeId, planId) => {
    return db.transaction(async (trx) => {
      // 1. Verify plan
      const plan = await membershipModel.findPlanById(planId, collegeId, trx);
      if (!plan || !plan.is_active) {
        throw new AppError('Membership plan is invalid or inactive', 400);
      }

      // 2. Check if student already has a membership
      const existingMem = await membershipModel.findByUserId(userId, collegeId, trx);
      if (existingMem) {
        if (existingMem.status === MEMBERSHIP_STATUS.ACTIVE) {
          throw new AppError('You already have an active membership with Skyline. You cannot join a second time.', 400);
        }
        if (existingMem.status === MEMBERSHIP_STATUS.PENDING) {
          throw new AppError('You already have a pending membership request. Please complete your existing payment instead of joining again.', 400);
        }
        throw new AppError('You have already joined a membership with Skyline.', 400);
      }

      const fee = parseFloat(plan.fee);
      const isFree = fee === 0;

      let startDate = null;
      let expiryDate = null;

      if (isFree) {
        const start = new Date();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + plan.duration_months);
        startDate = start.toISOString().split('T')[0];
        expiryDate = expiry.toISOString().split('T')[0];
      }

      // 3. Create membership record
      const membership = await membershipModel.createMembership(
        collegeId,
        {
          user_id: userId,
          plan_id: plan.id,
          status: isFree ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.PENDING,
          dues_status: isFree ? DUES_STATUS.PAID : DUES_STATUS.UNPAID,
          start_date: startDate,
          expiry_date: expiryDate
        },
        trx
      );

      let payment = null;
      if (!isFree) {
        // Create pending payment
        payment = await paymentModel.create(
          collegeId,
          {
            user_id: userId,
            payable_type: PAYABLE_TYPE.MEMBERSHIP,
            payable_id: membership.id,
            amount: fee,
            status: PAYMENT_STATUS.PENDING,
            transaction_ref: generateTransactionRef()
          },
          trx
        );
      }

      return {
        membership,
        payment,
        paymentId: payment ? payment.id : null,
        requiresPayment: !isFree
      };
    });
  },

  /**
   * Student retrieves own membership status.
   */
  getMyMembership: async (userId, collegeId) => {
    const membership = await membershipModel.findByUserId(userId, collegeId);
    if (!membership) {
      return { hasMembership: false, isActive: false, membership: null };
    }

    const today = new Date().toISOString().split('T')[0];
    const isCurrentlyActive =
      String(membership.status).toLowerCase() === 'active' &&
      String(membership.dues_status).toLowerCase() === 'paid' &&
      (!membership.expiry_date || membership.expiry_date >= today);

    let pendingPayment = null;
    if (String(membership.status).toLowerCase() === 'pending') {
      pendingPayment = await paymentModel.findByPayable(
        PAYABLE_TYPE.MEMBERSHIP,
        membership.id,
        collegeId
      );
    }

    return {
      ...membership,
      hasMembership: true,
      isActive: isCurrentlyActive,
      status: isCurrentlyActive ? 'ACTIVE' : (membership.status ? String(membership.status).toUpperCase() : 'PENDING'),
      rawStatus: membership.status,
      pendingPaymentId: pendingPayment ? pendingPayment.id : null,
      membership
    };
  },

  /**
   * Lists all members of the college with filters.
   */
  listMembers: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      status: queryParams.status,
      search: queryParams.search,
      offset,
      limit
    };

    const members = await membershipModel.findAllMembers(collegeId, filters);
    const total = await membershipModel.countMembers(collegeId, filters);

    return {
      data: members,
      meta: buildPaginationMeta(total, page, limit)
    };
  },

  /**
   * Verifies member status by user ID or email.
   * Usable by College Admin and Organizer at the gate.
   */
  verifyMemberStatus: async (collegeId, identifier) => {
    const record = await membershipModel.verifyMemberStatus(collegeId, identifier);
    if (!record) {
      return {
        isMember: false,
        status: 'not_found',
        message: 'No membership record found for this student'
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const isActive =
      record.status === MEMBERSHIP_STATUS.ACTIVE &&
      record.dues_status === DUES_STATUS.PAID &&
      record.expiry_date >= today;

    return {
      isMember: isActive,
      status: record.status,
      duesStatus: record.dues_status,
      expiryDate: record.expiry_date,
      planName: record.plan_name,
      user: {
        id: record.user_id,
        name: record.user_name,
        email: record.user_email
      }
    };
  }
};

module.exports = membershipsService;
