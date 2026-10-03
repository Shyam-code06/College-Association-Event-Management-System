import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // Return the response data envelope directly
    return response.data;
  },
  (error) => {
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }

    const { status, data } = error.response;

    if (status === 401) {
      useAuthStore.getState().clearAuth();
      try {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }

      } catch (e) {
        // Navigation not available in test environment
      }
    } else if (status === 403) {
      toast.error(data?.message || 'Access denied: You do not have permission for this action.');
    }

    // Attach server message and field errors
    let errorMessage = data?.message || 'An unexpected error occurred.';
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const fieldDetails = data.errors.map((e) => e.message || e.msg).filter(Boolean).join(', ');
      if (fieldDetails && (errorMessage === 'Validation failed' || !errorMessage.includes(':'))) {
        errorMessage = `Validation failed: ${fieldDetails}`;
      }
    }

    const errorObj = {
      status,
      message: errorMessage,
      errors: data?.errors || [],
      raw: data,
    };

    return Promise.reject(errorObj);
  }
);

export default apiClient;
