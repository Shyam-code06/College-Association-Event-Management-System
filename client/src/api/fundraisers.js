import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/fundraisers');

export const fundraisersApi = {
  ...base,
  getTasks: (fundraiserId) => apiClient.get(`/fundraisers/${fundraiserId}/tasks`),
  createTask: (fundraiserId, data) =>
    apiClient.post(`/fundraisers/${fundraiserId}/tasks`, data),
  getMyTasks: (params) => apiClient.get('/fundraisers/tasks/my', { params }),
  updateTaskStatus: (taskId, status) =>
    apiClient.patch(`/fundraisers/tasks/${taskId}/status`, { status }),
  getStudents: () => apiClient.get('/fundraisers/volunteers/students'),
};

export default fundraisersApi;
