import apiClient from './client';

export const paymentsApi = {
  process: (paymentId, shouldSucceed = true) =>
    apiClient.post(`/payments/${paymentId}/process`, { shouldSucceed }),
  getMyPayments: (params) => apiClient.get('/payments/me', { params }),
  getPending: (params) => apiClient.get('/payments/pending', { params }),
  get: (id) => apiClient.get(`/payments/${id}`),
};

export default paymentsApi;
