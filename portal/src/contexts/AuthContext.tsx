import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string;
  login: (adminAccess?: boolean, userUsername?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  // Check if user is already authenticated on app load
  useEffect(() => {
    const authenticated = sessionStorage.getItem('portal_authenticated');
    const adminStatus = sessionStorage.getItem('portal_admin');
    const storedUsername = sessionStorage.getItem('portal_username');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(adminStatus === 'true');
      setUsername(storedUsername || '');
    }
  }, []);

  const login = (adminAccess: boolean = false, userUsername: string = '') => {
    setIsAuthenticated(true);
    setIsAdmin(adminAccess);
    setUsername(userUsername);
    sessionStorage.setItem('portal_authenticated', 'true');
    sessionStorage.setItem('portal_admin', adminAccess.toString());
    sessionStorage.setItem('portal_username', userUsername);
  };

  const logout = () => {
    sessionStorage.removeItem('portal_authenticated');
    sessionStorage.removeItem('portal_admin');
    sessionStorage.removeItem('portal_username');
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUsername('');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      username,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 