import apiClient from './client';
import { createResourceApi } from './resource';

const base = createResourceApi('/products');

export const productsApi = {
  ...base,
  getInventorySummary: () => apiClient.get('/products/inventory-summary'),
  addVariant: (productId, data) => apiClient.post(`/products/${productId}/variants`, data),
  updateStock: (variantId, data) =>
    apiClient.patch(`/products/variants/${variantId}/stock`, data),
};

export default productsApi;
