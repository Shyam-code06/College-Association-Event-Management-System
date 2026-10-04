import apiClient from './client';

export const superAdminApi = {
  getCollegeAdmins: (params) => apiClient.get('/super-admin/college-admins', { params }),
  createCollegeAdmin: (data) => apiClient.post('/super-admin/college-admins', data),
  getCollegeAdmin: (id) => apiClient.get(`/super-admin/college-admins/${id}`),
  toggleAccess: (id, data) => apiClient.patch(`/super-admin/college-admins/${id}/access`, data),
  deleteCollegeAdmin: (id) => apiClient.delete(`/super-admin/college-admins/${id}`),
  resetPassword: (id, newPassword = '123456') =>
    apiClient.post(`/super-admin/college-admins/${id}/reset-password`, { newPassword }),
};

export default superAdminApi;
