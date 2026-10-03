import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/utils/constants';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets authentication token and user data', () => {
    const user = { id: 1, name: 'Diya', email: 'diya@skyline.edu', role: ROLES.STUDENT };
    useAuthStore.getState().setAuth('test-token-xyz', user);

    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token-xyz');
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isStudent()).toBe(true);
    expect(state.isSuperAdmin()).toBe(false);
  });

  it('updates user profile data', () => {
    useAuthStore.getState().setAuth('token', { id: 1, name: 'Diya', role: ROLES.STUDENT });
    useAuthStore.getState().updateUser({ name: 'Diya Sharma' });

    expect(useAuthStore.getState().user.name).toBe('Diya Sharma');
  });

  it('clears authentication on logout', () => {
    useAuthStore.getState().setAuth('token', { id: 1, name: 'Diya', role: ROLES.STUDENT });
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
