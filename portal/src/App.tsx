import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CastPage } from './pages/CastPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default route redirects to home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Authentication route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main application routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/cast" element={<CastPage />} />
          
          {/* Catch-all route redirects to home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
