import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Screensaver } from '../components/Screensaver';

export function CastPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleExit = () => {
    navigate('/home');
  };

  return <Screensaver onExit={handleExit} />;
} 