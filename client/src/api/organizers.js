import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/organizers');

export const organizersApi = {
  ...base,
  toggleAccess: (id) => apiClient.patch(`/organizers/${id}/access`),
};

export default organizersApi;
