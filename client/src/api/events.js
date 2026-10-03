import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/events');

export const eventsApi = {
  ...base,
  cancel: (id) => apiClient.patch(`/events/${id}/cancel`),
  register: (eventId) => apiClient.post('/registrations', { eventId }),
  getMyRegistrations: (params) => apiClient.get('/registrations/me', { params }),
  getEventRegistrations: (eventId, params) =>
    apiClient.get(`/registrations/event/${eventId}`, { params }),
};

export default eventsApi;
