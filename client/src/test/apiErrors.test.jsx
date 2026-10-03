import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const server = setupServer(
  http.get('http://localhost:5000/api/v1/test-401', () => {
    return HttpResponse.json(
      { success: false, message: 'Unauthorized session' },
      { status: 401 }
    );
  }),

  http.get('http://localhost:5000/api/v1/test-403', () => {
    return HttpResponse.json(
      { success: false, message: 'Access denied to this module' },
      { status: 403 }
    );
  }),

  http.post('http://localhost:5000/api/v1/test-validation', () => {
    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid parameters',
        errors: [{ field: 'email', message: 'Email already exists' }],
      },
      { status: 400 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Axios Client Error Interceptor', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth('test-token', { id: 1, name: 'User', role: 'student' });
  });

  it('handles 401 by clearing auth state and rejecting error', async () => {
    try {
      await apiClient.get('/test-401');
      expect.fail('Should have thrown 401 error');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.message).toBe('Unauthorized session');
      // Auth store cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().token).toBeNull();
    }
  });

  it('handles 403 forbidden error envelope', async () => {
    try {
      await apiClient.get('/test-403');
      expect.fail('Should have thrown 403 error');
    } catch (err) {
      expect(err.status).toBe(403);
      expect(err.message).toBe('Access denied to this module');
    }
  });

  it('maps backend field errors array onto rejected error', async () => {
    try {
      await apiClient.post('/test-validation', {});
      expect.fail('Should have thrown validation error');
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.message).toBe('Invalid parameters');
      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]).toEqual({
        field: 'email',
        message: 'Email already exists',
      });
    }
  });
});
