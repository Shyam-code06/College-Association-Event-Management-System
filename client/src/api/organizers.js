import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/organizers');

export const organizersApi = {
  ...base,
  toggleAccess: (id, isActive) => apiClient.patch(`/organizers/${id}/access`, { isActive }),
};

export default organizersApi;
