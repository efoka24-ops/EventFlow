import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { adminLogin as apiAdminLogin, adminLogout as apiAdminLogout, getAdminUser } from "@/api/authApi";
import { tokenStore } from "@/api/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadFromToken = useCallback(() => {
    const adminUser = getAdminUser();
    if (adminUser) {
      setUser(adminUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    loadFromToken();
  }, [loadFromToken]);

  const loginAsAdmin = async (email, password) => {
    try {
      const { user: adminUser } = await apiAdminLogin({ email, password });
      const decoded = getAdminUser();
      const merged = { ...adminUser, ...(decoded || {}), role: decoded?.role || adminUser?.role || "admin", isAdmin: true };
      setUser(merged);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    apiAdminLogout();
    tokenStore.clearCreatorToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.assign("/admin/login");
  };

  const checkUserAuth = () => {
    loadFromToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked: true,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: null,
        logout,
        loginAsAdmin,
        navigateToLogin,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
      authChecked: true,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout: () => {},
      loginAsAdmin: async () => false,
      navigateToLogin: () => { window.location.assign("/admin/login"); },
      checkUserAuth: () => {},
    };
  }
  return ctx;
};
