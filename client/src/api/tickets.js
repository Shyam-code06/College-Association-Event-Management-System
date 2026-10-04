import apiClient from './client';

export const ticketsApi = {
  getQrCode: (registrationId) => apiClient.get(`/tickets/${registrationId}/qr`),
  scanTicket: (data) => apiClient.post('/tickets/scan', data),
  deleteAttendance: (data) => apiClient.post('/tickets/attendance/delete', data),
};

export default ticketsApi;
