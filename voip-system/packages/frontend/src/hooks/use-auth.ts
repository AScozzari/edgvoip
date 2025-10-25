import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string | null;
  role: 'super_admin' | 'tenant_admin' | 'tenant_user';
  iat?: number;
  exp?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('edgvoip-token');
    if (token) {
      try {
        // Check if token is a valid JWT format
        if (token.split('.').length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          tenant_id: payload.tenant_id,
          role: payload.role,
          iat: payload.iat,
          exp: payload.exp,
        };

        // Check if token is expired
        if (user.exp && user.exp * 1000 < Date.now()) {
          localStorage.removeItem('edgvoip-token');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
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
        localStorage.removeItem('edgvoip-token');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const login = useCallback((token: string) => {
    try {
      // Check if token is a valid JWT format
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        tenant_id: payload.tenant_id,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };

      localStorage.setItem('edgvoip-token', token);
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
      localStorage.removeItem('edgvoip-token');
      throw new Error('Invalid token');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edgvoip-token');
    apiClient.clearToken();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshToken = useCallback(async () => {
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
  }, [authState.token, logout]);

  return {
    ...authState,
    login,
    logout,
    refreshToken,
  };
}