import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthenticatedApi = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Check if session expired
    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Session expired, redirecting to login');
      logout();
      navigate('/login');
      throw new Error('Session expired');
    }
    
    return response;
  };

  return { apiCall };
};
