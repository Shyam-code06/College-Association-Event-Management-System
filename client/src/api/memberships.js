import apiClient from './client';

export const membershipsApi = {
  getPlans: () => apiClient.get('/memberships/plans'),
  createPlan: (data) => apiClient.post('/memberships/plans', data),
  updatePlan: (id, data) => apiClient.put(`/memberships/plans/${id}`, data),
  join: (data) => apiClient.post('/memberships/join', data),
  getMyMembership: () => apiClient.get('/memberships/me'),
  listMembers: (params) => apiClient.get('/memberships', { params }),
  verifyMembership: (id) => apiClient.get(`/memberships/${id}/verify`),
};

export default membershipsApi;
