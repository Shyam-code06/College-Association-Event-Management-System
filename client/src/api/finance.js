import apiClient from './client';

export const financeApi = {
  getCategories: () => apiClient.get('/finance/categories'),
  createCategory: (data) => apiClient.post('/finance/categories', data),
  getTransactions: (params) => apiClient.get('/finance/transactions', { params }),
  createManualEntry: (data) => apiClient.post('/finance/manual', data),
  getSummary: (params) => apiClient.get('/finance/summary', { params }),
};

export default financeApi;
