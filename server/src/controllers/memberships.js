const membershipsService = require('../services/memberships');
const { sendSuccess } = require('../utils/response');

const membershipsController = {
  createPlan: async (req, res) => {
    const plan = await membershipsService.createPlan(req.collegeId, req.user, req.body);
    const msg = req.user.role === 'organizer'
      ? 'Membership plan submitted for College Admin approval'
      : 'Membership plan created successfully';
    return sendSuccess(res, 201, msg, plan);
  },

  listPlans: async (req, res) => {
    const plans = await membershipsService.listPlans(req.collegeId, req.user);
    return sendSuccess(res, 200, 'Membership plans retrieved successfully', plans);
  },

  reviewPlanApproval: async (req, res) => {
    const updated = await membershipsService.reviewPlanApproval(
      req.params.id,
      req.collegeId,
      req.body.approval_status
    );
    return sendSuccess(res, 200, `Membership plan ${req.body.approval_status} successfully`, updated);
  },

  updatePlan: async (req, res) => {
    const updated = await membershipsService.updatePlan(req.params.id, req.collegeId, req.body);
    return sendSuccess(res, 200, 'Membership plan updated successfully', updated);
  },

  join: async (req, res) => {
    const result = await membershipsService.joinMembership(req.user.id, req.collegeId, req.body.planId);
    return sendSuccess(res, 201, 'Membership initiated successfully', result);
  },

  getMyMembership: async (req, res) => {
    const result = await membershipsService.getMyMembership(req.user.id, req.collegeId);
    return sendSuccess(res, 200, 'Membership status retrieved successfully', result);
  },

  listMembers: async (req, res) => {
    const result = await membershipsService.listMembers(req.collegeId, req.query);
    return sendSuccess(res, 200, 'Members retrieved successfully', result.data, result.meta);
  },

  verifyStatus: async (req, res) => {
    const result = await membershipsService.verifyMemberStatus(req.collegeId, req.query.identifier);
    return sendSuccess(res, 200, 'Member verification completed', result);
  },

  adminCreateMembership: async (req, res) => {
    const result = await membershipsService.adminCreateMembership(req.collegeId, req.body);
    return sendSuccess(res, 201, 'Student membership created successfully', result);
  },

  deleteMembership: async (req, res) => {
    const result = await membershipsService.deleteMembership(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Student membership deleted successfully', result);
  },

  requestCancellation: async (req, res) => {
    const result = await membershipsService.requestCancellation(
      req.params.id,
      req.user.id,
      req.collegeId,
      req.body.reason
    );
    return sendSuccess(res, 200, 'Membership cancellation request submitted for administrative review', result);
  },

  reviewCancellation: async (req, res) => {
    const result = await membershipsService.reviewCancellation(
      req.params.id,
      req.collegeId,
      req.user,
      req.body
    );
    return sendSuccess(
      res,
      200,
      `Membership cancellation request ${req.body.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      result
    );
  },

  getPlanMembers: async (req, res) => {
    const result = await membershipsService.getPlanMembers(req.params.id, req.collegeId);
    return sendSuccess(res, 200, 'Plan members retrieved successfully', result);
  }
};

module.exports = membershipsController;
