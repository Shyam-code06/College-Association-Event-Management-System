import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(user.role);
    if (!isAllowed) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children ? children : null;
};

export default ProtectedRoute;
