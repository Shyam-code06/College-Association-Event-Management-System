import apiClient from './client';

export const ordersApi = {
  create: (data) => apiClient.post('/orders', data),
  getMyOrders: (params) => apiClient.get('/orders/me', { params }),
  getAll: (params) => apiClient.get('/orders', { params }),
  get: (id) => apiClient.get(`/orders/${id}`),
};

export default ordersApi;
