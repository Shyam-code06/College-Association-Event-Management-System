import apiClient from './client';

export const collegesApi = {
  getPublic: () => apiClient.get('/colleges/public'),
};

export default collegesApi;
