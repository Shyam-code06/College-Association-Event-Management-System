import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ROLES } from '@/utils/constants';

const safeStorage = {
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch (e) {
      return null;
    }
    return null;
  },
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch (e) {
      return;
    }
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch (e) {
      return;
    }
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: Boolean(token && user),
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clearAuth: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      // Helper getters
      isSuperAdmin: () => get().user?.role === ROLES.SUPER_ADMIN,
      isCollegeAdmin: () => get().user?.role === ROLES.COLLEGE_ADMIN,
      isOrganizer: () => get().user?.role === ROLES.ORGANIZER,
      isStudent: () => get().user?.role === ROLES.STUDENT,
      hasRole: (roleOrRoles) => {
        const userRole = get().user?.role;
        if (!userRole) return false;
        if (Array.isArray(roleOrRoles)) {
          return roleOrRoles.includes(userRole);
        }
        return userRole === roleOrRoles;
      },
    }),
    {
      name: 'skyline_auth_store',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
