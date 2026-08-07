import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ unauthenticatedElement }) {
  const ventixUser = localStorage.getItem('ventix_user');
  
  let contextAuth = false;
  try {
    const authStorage = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authStorage) contextAuth = true;
  } catch (e) {
    // ignora
  }

  const isAuthenticated = Boolean(ventixUser) || contextAuth;

  if (!isAuthenticated) {
    return unauthenticatedElement || <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
