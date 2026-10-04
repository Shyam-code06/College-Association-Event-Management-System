const db = require('../config/database');
const membershipModel = require('../models/membership');
const userModel = require('../models/user');
const paymentModel = require('../models/payment');
const { generateTransactionRef } = require('./mockPayment');
const { MEMBERSHIP_STATUS, DUES_STATUS, PAYMENT_STATUS, PAYABLE_TYPE } = require('../constants/statuses');
const AppError = require('../utils/appError');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const membershipsService = {
  /**
   * Creates a new membership plan for the college.
   * If created by an Organizer, it defaults to pending_approval and requires College Admin approval.
   */
  createPlan: async (collegeId, creator, planData) => {
    const isOrganizer = creator?.role === 'organizer';
    let assigned = Array.isArray(planData.assigned_organizers)
      ? [...planData.assigned_organizers]
      : (planData.assigned_organizers ? [planData.assigned_organizers] : []);

    let organizationName = planData.organization || 'Odoo Student Association';
    if (isOrganizer) {
      // Organizer creates plans strictly for their own society & assigned to their own email
      assigned = creator?.email ? [creator.email.toLowerCase().trim()] : [];
      if (creator?.name) {
        const cleaned = creator.name.replace(/\s+organizer$/i, '').trim();
        organizationName = cleaned || creator.name;
      }
    }

    const payload = {
      ...planData,
      organization: organizationName,
      assigned_organizers: assigned,
      created_by: creator?.id || null,
      approval_status: isOrganizer ? 'pending_approval' : (planData.approval_status || 'approved'),
      is_active: isOrganizer ? false : (planData.is_active !== undefined ? planData.is_active : true)
    };

    return membershipModel.createPlan(collegeId, payload);
  },

  /**
   * Approves or rejects a membership plan (College Admin).
   */
  reviewPlanApproval: async (id, collegeId, approvalStatus) => {
    const plan = await membershipModel.findPlanById(id, collegeId);
    if (!plan) {
      throw new AppError('Membership plan not found', 404);
    }

    const updatePayload = {
      approval_status: approvalStatus,
      is_active: approvalStatus === 'approved'
    };

    return membershipModel.updatePlan(id, collegeId, updatePayload);
  },

  /**
   * Lists membership plans for the college according to user role.
   */
  listPlans: async (collegeId, user) => {
    return membershipModel.findAllPlans(collegeId, {
      role: user?.role,
      userEmail: user?.email,
      userId: user?.id
    });
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

      // 2. Check if student already has a membership for THIS specific plan
      const existingPlanMem = await membershipModel.findByUserIdAndPlan(userId, plan.id, collegeId, trx);
      if (existingPlanMem) {
        if (String(existingPlanMem.status).toLowerCase() === 'active') {
          throw new AppError(`You already have an active membership for "${plan.name}".`, 400);
        }
        if (String(existingPlanMem.status).toLowerCase() === 'pending') {
          throw new AppError(`You already have a pending membership request for "${plan.name}". Please complete your payment.`, 400);
        }
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
   * Student retrieves own membership status and list of all memberships.
   */
  getMyMembership: async (userId, collegeId) => {
    const allMemberships = await membershipModel.findAllByUserId(userId, collegeId);
    if (!allMemberships || allMemberships.length === 0) {
      return { hasMembership: false, isActive: false, memberships: [], activeMemberships: [], membership: null };
    }

    const today = new Date().toISOString().split('T')[0];
    const activeMemberships = allMemberships.filter((m) =>
      String(m.status).toLowerCase() === 'active' &&
      String(m.dues_status).toLowerCase() === 'paid' &&
      (!m.expiry_date || m.expiry_date >= today)
    );

    const pendingMemberships = allMemberships.filter((m) =>
      String(m.status).toLowerCase() === 'pending' || String(m.dues_status).toLowerCase() === 'unpaid'
    );

    let maxDiscountPercent = 0;
    activeMemberships.forEach((m) => {
      const disc = parseFloat(m.merch_discount_percent || 0);
      if (disc > maxDiscountPercent) maxDiscountPercent = disc;
    });

    // Sort active memberships so the highest discount (most profitable) membership is primary
    activeMemberships.sort(
      (a, b) => parseFloat(b.merch_discount_percent || 0) - parseFloat(a.merch_discount_percent || 0)
    );

    const isCurrentlyActive = activeMemberships.length > 0;
    const primaryMembership = activeMemberships[0] || pendingMemberships[0] || allMemberships[0];

    let pendingPayment = null;
    if (primaryMembership && String(primaryMembership.status).toLowerCase() === 'pending') {
      pendingPayment = await paymentModel.findByPayable(
        PAYABLE_TYPE.MEMBERSHIP,
        primaryMembership.id,
        collegeId
      );
    }

    return {
      ...primaryMembership,
      hasMembership: allMemberships.length > 0,
      isActive: isCurrentlyActive,
      activeCount: activeMemberships.length,
      memberships: allMemberships,
      activeMemberships,
      pendingMemberships,
      maxDiscountPercent,
      merch_discount_percent: isCurrentlyActive ? maxDiscountPercent : parseFloat(primaryMembership?.merch_discount_percent || 0),
      status: isCurrentlyActive ? 'ACTIVE' : (primaryMembership.status ? String(primaryMembership.status).toUpperCase() : 'PENDING'),
      rawStatus: primaryMembership.status,
      pendingPaymentId: pendingPayment ? pendingPayment.id : null,
      membership: primaryMembership
    };
  },

  /**
   * Lists all members of the college with filters.
   */
  listMembers: async (collegeId, queryParams) => {
    const { page, limit, offset } = getPaginationParams(queryParams);
    const filters = {
      status: queryParams.status,
      organization: queryParams.organization,
      search: queryParams.search,
      planId: queryParams.planId ? Number(queryParams.planId) : undefined,
      cancellationStatus: queryParams.cancellationStatus,
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
   * College Admin or Organizer directly grants student membership(s) for an organization.
   * Supports assigning multiple students simultaneously via `userIds`.
   */
  adminCreateMembership: async (collegeId, { userId, userIds, planId, organization, status, duesStatus, durationMonths }) => {
    const targetUserIds = Array.isArray(userIds) && userIds.length > 0 ? userIds : (userId ? [userId] : []);
    if (targetUserIds.length === 0) {
      throw new AppError('At least one student must be selected', 400);
    }

    const plan = await membershipModel.findPlanById(planId, collegeId);
    if (!plan) {
      throw new AppError('Membership plan not found', 404);
    }

    const orgToUse = organization?.trim() || plan.organization || 'Odoo Student Association';
    const months = durationMonths || plan.duration_months || 12;

    const start = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    const startDate = start.toISOString().split('T')[0];
    const expiryDate = expiry.toISOString().split('T')[0];

    const results = [];
    for (const uid of targetUserIds) {
      const user = await userModel.findById(uid, collegeId);
      if (!user) continue;

      // Check if student already has active membership for this plan
      const existing = await membershipModel.findByUserId(uid, collegeId);
      if (existing && existing.status === MEMBERSHIP_STATUS.ACTIVE) {
        // Update existing expiry if renewing/extending
        await membershipModel.updateMembership(existing.id, collegeId, {
          plan_id: planId,
          organization: orgToUse,
          status: MEMBERSHIP_STATUS.ACTIVE,
          dues_status: DUES_STATUS.PAID,
          expiry_date: expiryDate
        });
        results.push(existing);
      } else {
        const membership = await membershipModel.createMembership(collegeId, {
          user_id: uid,
          plan_id: planId,
          organization: orgToUse,
          status: status || MEMBERSHIP_STATUS.ACTIVE,
          dues_status: duesStatus || DUES_STATUS.PAID,
          start_date: startDate,
          expiry_date: expiryDate
        });
        results.push(membership);
      }
    }

    return results.length === 1 ? results[0] : results;
  },

  /**
   * College Admin deletes any student membership created by any organization.
   */
  deleteMembership: async (id, collegeId) => {
    const membership = await membershipModel.findById(id, collegeId);
    if (!membership) {
      throw new AppError('Membership record not found', 404);
    }

    await membershipModel.deleteMembership(id, collegeId);
    return { id, isDeleted: true };
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
  },

  /**
   * Student requests membership cancellation within 5 days of joining.
   */
  requestCancellation: async (membershipId, userId, collegeId, reason) => {
    const membership = await membershipModel.findById(membershipId, collegeId);
    if (!membership || Number(membership.user_id) !== Number(userId)) {
      throw new AppError('Membership record not found.', 404);
    }

    if (String(membership.status).toLowerCase() !== 'active') {
      throw new AppError('Only active memberships can be cancelled.', 400);
    }

    // Check 5-day window from created_at or start_date
    const joinedTime = new Date(membership.created_at || membership.start_date).getTime();
    const now = Date.now();
    const diffDays = (now - joinedTime) / (1000 * 60 * 60 * 24);
    if (diffDays > 5) {
      throw new AppError(
        'Cancellation is only permitted within 5 days of joining membership. Your joining date was more than 5 days ago.',
        400
      );
    }

    if (membership.cancellation_status === 'pending') {
      throw new AppError('A cancellation request for this membership is already pending review.', 400);
    }

    const updated = await membershipModel.updateMembership(membershipId, collegeId, {
      cancellation_status: 'pending',
      cancellation_reason: reason ? String(reason).trim() : 'Student requested cancellation within 5 days',
      cancellation_requested_at: new Date()
    });

    return updated;
  },

  /**
   * College Admin or Organizer reviews student membership cancellation request.
   */
  reviewCancellation: async (membershipId, collegeId, reviewerUser, { action, reviewNote }) => {
    const membership = await membershipModel.findById(membershipId, collegeId);
    if (!membership) {
      throw new AppError('Membership record not found.', 404);
    }

    if (membership.cancellation_status !== 'pending') {
      throw new AppError('No pending cancellation request found for this membership.', 400);
    }

    if (action === 'approve') {
      const updated = await membershipModel.updateMembership(membershipId, collegeId, {
        status: 'cancelled',
        cancellation_status: 'approved',
        cancellation_reviewed_by: reviewerUser.id,
        cancellation_reviewed_at: new Date(),
        cancellation_review_note: reviewNote ? String(reviewNote).trim() : 'Cancellation approved by administration'
      });
      return updated;
    } else {
      const updated = await membershipModel.updateMembership(membershipId, collegeId, {
        status: 'active',
        cancellation_status: 'rejected',
        cancellation_reviewed_by: reviewerUser.id,
        cancellation_reviewed_at: new Date(),
        cancellation_review_note: reviewNote ? String(reviewNote).trim() : 'Cancellation request rejected'
      });
      return updated;
    }
  },

  /**
   * Organizer or College Admin retrieves all enrolled students for a particular membership plan.
   */
  getPlanMembers: async (planId, collegeId) => {
    const plan = await membershipModel.findPlanById(planId, collegeId);
    if (!plan) {
      throw new AppError('Membership plan not found.', 404);
    }

    const members = await membershipModel.findAllMembers(collegeId, {
      planId: Number(planId),
      limit: 500,
      offset: 0
    });

    return {
      plan,
      members,
      totalCount: members.length
    };
  }
};

module.exports = membershipsService;
