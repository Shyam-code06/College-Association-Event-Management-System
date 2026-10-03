const membershipsService = require('../services/memberships');
const { sendSuccess } = require('../utils/response');

const membershipsController = {
  createPlan: async (req, res) => {
    const plan = await membershipsService.createPlan(req.collegeId, req.body);
    return sendSuccess(res, 201, 'Membership plan created successfully', plan);
  },

  listPlans: async (req, res) => {
    const plans = await membershipsService.listPlans(req.collegeId);
    return sendSuccess(res, 200, 'Membership plans retrieved successfully', plans);
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
  }
};

module.exports = membershipsController;
