import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/utils/constants';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('redirects unauthenticated user to /login', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders content when role is allowed', () => {
    useAuthStore.getState().setAuth('dummy-token', {
      id: 1,
      name: 'College Admin',
      role: ROLES.COLLEGE_ADMIN,
    });

    render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <Routes>
          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
                <div>College Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('College Admin Dashboard')).toBeInTheDocument();
  });

  it('blocks Super Admin from college-admin routes and redirects to /forbidden', () => {
    useAuthStore.getState().setAuth('dummy-token', {
      id: 99,
      name: 'Super Admin',
      role: ROLES.SUPER_ADMIN,
    });

    render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <Routes>
          <Route path="/forbidden" element={<div>Access Forbidden</div>} />
          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
                <div>College Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('College Admin Dashboard')).not.toBeInTheDocument();
  });
});
