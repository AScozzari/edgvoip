import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '@/lib/api';
import SessionTimeout from '@/components/SessionTimeout';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  tenantSlug: string;
  tenantName?: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  iat?: number;
  exp?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        // Check if token is a valid JWT format
        if (token.split('.').length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Parse user data from localStorage
        const user: User = JSON.parse(userData);

        // Check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          apiClient.clearToken();
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          // Set token in API client
          apiClient.setToken(token);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiClient.clearToken();
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      apiClient.clearToken();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // Sync token with API client whenever auth state changes
  useEffect(() => {
    if (authState.token) {
      apiClient.setToken(authState.token);
    } else {
      apiClient.clearToken();
    }
  }, [authState.token]);

  // Session timeout management - check token expiry
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.token) return;

    const checkTokenExpiry = () => {
      try {
        const payload = JSON.parse(atob(authState.token!.split('.')[1]));
        const now = Date.now();
        const tokenExpiry = payload.exp * 1000;
        
        // Check if token is expired (with 1 minute grace period)
        if (tokenExpiry < (now + 60 * 1000)) {
          console.log('Session expired - logging out');
          logout();
          // Extract tenant slug from current path
          const pathParts = location.pathname.split('/').filter(Boolean);
          const tenantSlug = pathParts[0] || 'demo';
          // Redirect to tenant login page
          navigate(`/${tenantSlug}/login`);
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
        logout();
        // Extract tenant slug from current path
        const pathParts = location.pathname.split('/').filter(Boolean);
        const tenantSlug = pathParts[0] || 'demo';
        navigate(`/${tenantSlug}/login`);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Set up interval to check every 5 minutes (less aggressive)
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.token, navigate, location]);

  // Handle navigation based on auth state - removed automatic redirects for multi-tenant

  const login = async (token: string) => {
    try {
      // Check if token is a valid JWT format
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: payload.id || payload.userId,
        email: payload.email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        tenantId: payload.tenant_id || payload.tenantId,
        tenantSlug: payload.role === 'super_admin' ? 'edgvoip' : (payload.tenant_slug || payload.tenantSlug),
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set token in API client
      apiClient.setToken(token);
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Invalid token:', error);
      // Clear any invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      apiClient.clearToken();
      throw new Error('Invalid token');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiClient.clearToken();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    if (!authState.token) return false;

    try {
      // Check if token is a valid JWT format
      if (authState.token.split('.').length !== 3) {
        logout();
        return false;
      }
      
      // In a real implementation, you would call a refresh endpoint
      // For now, we'll just check if the current token is still valid
      const payload = JSON.parse(atob(authState.token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // Calculate session expiry time
  const getSessionExpiry = () => {
    if (!authState.token) return 0;
    try {
      const payload = JSON.parse(atob(authState.token.split('.')[1]));
      return payload.iat * 1000 + (15 * 60 * 1000); // 15 minutes from login time
    } catch {
      return 0;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
      {authState.isAuthenticated && (
        <SessionTimeout
          expiresAt={getSessionExpiry()}
          onLogout={() => {
            logout();
            // Extract tenant slug from current path
            const pathParts = location.pathname.split('/').filter(Boolean);
            const tenantSlug = pathParts[0] || 'demo';
            navigate(`/${tenantSlug}/login`);
          }}
        />
      )}
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
