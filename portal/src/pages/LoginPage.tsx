import React from 'react';
import { Navigate } from 'react-router-dom';
import { PasswordLogin } from '../components/PasswordLogin';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <PasswordLogin onAuthenticated={login} />;
} 