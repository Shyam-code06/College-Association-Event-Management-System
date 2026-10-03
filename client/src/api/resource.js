import apiClient from './client';

export const createResourceApi = (basePath) => ({
  list: (params = {}) => apiClient.get(basePath, { params }),
  get: (id) => apiClient.get(`${basePath}/${id}`),
  create: (data) => apiClient.post(basePath, data),
  update: (id, data) => apiClient.patch(`${basePath}/${id}`, data),
  put: (id, data) => apiClient.put(`${basePath}/${id}`, data),
  patch: (id, data) => apiClient.patch(`${basePath}/${id}`, data),
  remove: (id) => apiClient.delete(`${basePath}/${id}`),
});

export default createResourceApi;
