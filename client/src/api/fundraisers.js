import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/fundraisers');

export const fundraisersApi = {
  ...base,
  getTasks: (fundraiserId) => apiClient.get(`/fundraisers/${fundraiserId}/tasks`),
  createTask: (fundraiserId, data) =>
    apiClient.post(`/fundraisers/${fundraiserId}/tasks`, data),
  getMyTasks: (params) => apiClient.get('/fundraisers/tasks/me', { params }),
  respondInvitation: (taskId, action) =>
    apiClient.patch(`/fundraisers/tasks/${taskId}/invitation`, { action }),
  updateTaskStatus: (taskId, status) =>
    apiClient.patch(`/fundraisers/tasks/${taskId}/status`, { status }),
  getStudents: (eventId) =>
    apiClient.get('/fundraisers/volunteers/students', {
      params: eventId ? { eventId } : {},
    }),
};

export default fundraisersApi;
