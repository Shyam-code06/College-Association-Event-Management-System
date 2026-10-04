import apiClient from './client';

export const financeApi = {
  getCategories: (params) => apiClient.get('/finance/categories', { params }),
  createCategory: (data) => apiClient.post('/finance/categories', data),
  getTransactions: (params) => apiClient.get('/finance/transactions', { params }),
  createManualEntry: (data) =>
    apiClient.post('/finance/transactions', {
      ...data,
      type: data.type ? String(data.type).toLowerCase() : undefined,
    }),
  getSummary: (params) => apiClient.get('/finance/summary', { params }),
};

export default financeApi;
