import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { setAccessToken } from '../services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<{ success: boolean; tfaRequired: boolean; tfaToken?: string; otpCode?: string }>;
  verifyTfa: (tfaToken: string, code: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  fetchCurrentUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

  // Fetch current user whenever token transitions to active
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setUser(null);
    }
  }, [token]);

  const isTokenValid = (jwt: string): boolean => {
    try {
      const payloadBase64 = jwt.split('.')[1];
      if (!payloadBase64) {
        return false;
      }
      const payload = JSON.parse(atob(payloadBase64));
      return payload.exp * 1000 > Date.now() + 10000;
    } catch {
      return false;
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch {
      setUser(null);
    }
    return null;
  };

  const restoreSession = async () => {
    const storedToken = sessionStorage.getItem('access_token');

    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      setAccessToken(storedToken);
      setIsAuthenticated(true);
      setIsRestored(true);
      return;
    }

    try {
      const response = await api.post('/auth/refresh', {});
      const data = response.data;

      if (data.success && data.access_token) {
        setToken(data.access_token);
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setAccessToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsRestored(true);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const data = response.data;
      if (data.tfa_required) {
        return {
          success: true,
          tfaRequired: true,
          tfaToken: data.tfa_token,
          otpCode: data.otp_code,
        };
      }

      if (!data.success || !data.access_token) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.access_token);
      setAccessToken(data.access_token);
      setIsAuthenticated(true);
      return { success: true, tfaRequired: false };
    } catch (error: any) {
      setToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      const msg = error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const verifyTfa = async (tfaToken: string, code: string) => {
    try {
      const response = await api.post('/auth/tfa/verify', {
        tfa_token: tfaToken,
        code,
      });

      const data = response.data;
      if (!data.success || !data.access_token) {
        throw new Error(data.message || 'Two-factor verification failed');
      }

      setToken(data.access_token);
      setAccessToken(data.access_token);
      setIsAuthenticated(true);
    } catch (error: any) {
      setToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      const msg = error.response?.data?.message || 'Two-factor verification failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  const refresh = async () => {
    try {
      const response = await api.post('/auth/refresh', {});
      const data = response.data;

      if (data.success && data.access_token) {
        setToken(data.access_token);
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      setToken(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, verifyTfa, logout, refresh, fetchCurrentUser }}>
      {isRestored ? (
        children
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};
