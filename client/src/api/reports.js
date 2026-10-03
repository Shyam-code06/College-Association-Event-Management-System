import apiClient from './client';

export const reportsApi = {
  getEventReport: (eventId) => apiClient.get(`/reports/events/${eventId}`),
  getCollegeOverview: () => apiClient.get('/reports/college/overview'),
};

export default reportsApi;
