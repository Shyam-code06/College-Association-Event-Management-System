import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  requestApproval: (email) => apiClient.post('/auth/request-approval', { email }),
  checkCampus: (email) => apiClient.post('/auth/check-campus', { email }),
  requestPasswordResetOtp: (email) => apiClient.post('/auth/forgot-password/request', { email }),
  verifyPasswordResetOtp: (data) => apiClient.post('/auth/forgot-password/verify-otp', data),
  resetPasswordWithOtp: (data) => apiClient.post('/auth/forgot-password/reset', data),
};

export default authApi;



