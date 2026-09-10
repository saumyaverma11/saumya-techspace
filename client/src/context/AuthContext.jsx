import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => authService.getStoredToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authService.removeStoredToken();
    setToken(null);
    setAdmin(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = authService.getStoredToken();
    if (!storedToken) {
      setAdmin(null);
      setToken(null);
      setLoading(false);
      return null;
    }

    try {
      const adminData = await authService.getMe();
      setAdmin(adminData);
      setToken(storedToken);
      return adminData;
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res && res.token) {
      authService.setStoredToken(res.token);
      setToken(res.token);
      setAdmin(res.data);
      return res.data;
    }
    throw new Error('Authentication response did not contain a valid token.');
  };

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: Boolean(token && admin),
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
