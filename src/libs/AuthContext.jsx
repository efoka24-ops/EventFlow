import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();
const ADMIN_PASSWORD = (/** @type {any} */ (import.meta).env?.VITE_ADMIN_PASSWORD || 'admin123').trim();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setAuthError(null);

    let hasSessionToken = false;
    try {
      hasSessionToken = Boolean(
        window.localStorage.getItem('base44_access_token') ||
        window.localStorage.getItem('base44_token')
      );
    } catch {
      hasSessionToken = false;
    }

    // If a token is present, verify it; otherwise treat as guest.
    if (hasSessionToken) {
      await checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      // A failed User/me check simply means the user is not logged in (guest).
      // Do NOT set authError here — that would block all public pages.
      try {
        window.localStorage.removeItem('base44_access_token');
        window.localStorage.removeItem('base44_token');
      } catch {}
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    window.location.assign('/admin/login');
  };

  const loginAsAdmin = async (password) => {
    if ((password || '').trim() !== ADMIN_PASSWORD) {
      return false;
    }

    const adminUser = {
      id: 'admin-local',
      full_name: 'Administrateur',
      email: 'admin@eventflow.local',
      role: 'admin',
      isAdmin: true,
    };

    try {
      window.localStorage.setItem('eventflow_current_user', JSON.stringify(adminUser));
    } catch {
      // Ignore storage errors in restricted environments.
    }

    setUser(adminUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      loginAsAdmin,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
