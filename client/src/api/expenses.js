import apiClient from './client';

export const expensesApi = {
  submitExpense: (formData) =>
    apiClient.post('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getMyExpenses: (params) => apiClient.get('/expenses/me', { params }),
  listExpenses: (params) => apiClient.get('/expenses', { params }),
  getExpense: (id) => apiClient.get(`/expenses/${id}`),
  reviewExpense: (id, reviewData) =>
    apiClient.patch(`/expenses/${id}/review`, reviewData),
};

export default expensesApi;
