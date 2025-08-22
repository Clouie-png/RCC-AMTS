import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (!user || !user.token) {
    console.log("ProtectedRoute: User not authenticated or token missing, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute: User role:", user.role);
  console.log("ProtectedRoute: Allowed roles:", allowedRoles);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log("ProtectedRoute: User role not allowed, redirecting to /unauthorized");
    return <Navigate to="/unauthorized" replace />; 
  }

  return <Outlet />;
};
