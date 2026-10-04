import apiClient from './client';

export const membershipsApi = {
  getPlans: () => apiClient.get('/memberships/plans'),
  createPlan: (data) => apiClient.post('/memberships/plans', data),
  updatePlan: (id, data) => apiClient.put(`/memberships/plans/${id}`, data),
  reviewPlanApproval: (id, approvalStatus) =>
    apiClient.patch(`/memberships/plans/${id}/approval`, { approval_status: approvalStatus }),
  join: (data) => apiClient.post('/memberships/join', data),
  getMyMembership: () => apiClient.get('/memberships/me'),
  listMembers: (params) => apiClient.get('/memberships', { params }),
  adminCreate: (data) => apiClient.post('/memberships/admin-create', data),
  deleteMember: (id) => apiClient.delete(`/memberships/${id}`),
  verifyMembership: (id) => apiClient.get(`/memberships/${id}/verify`),
  requestCancellation: (id, reason) => apiClient.post(`/memberships/${id}/cancel-request`, { reason }),
  reviewCancellation: (id, action, reviewNote) =>
    apiClient.patch(`/memberships/${id}/review-cancellation`, { action, reviewNote }),
  getPlanMembers: (planId) => apiClient.get(`/memberships/plans/${planId}/members`),
};

export default membershipsApi;
