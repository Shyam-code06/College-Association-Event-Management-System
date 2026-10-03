import apiClient from './client';

export const usersApi = {
  listStudents: (params = {}) =>
    apiClient.get('/users', {
      params: { ...params, role: 'student' },
    }),
  listCollegeUsers: (params = {}) =>
    apiClient.get('/users', { params }),
  toggleStatus: (id, isActive) =>
    apiClient.patch(`/users/${id}/status`, { isActive }),
  remove: (id) =>
    apiClient.delete(`/users/${id}`),
  approveAll: (role) =>
    apiClient.post('/users/approve-all', role ? { role } : {}),
  requestApproval: (email) =>
    apiClient.post('/auth/request-approval', { email }),
};

export default usersApi;
