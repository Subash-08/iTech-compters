// src/hooks/useAuthErrorHandler.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutSuccess } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';

export const useAuthErrorHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAuthError = useCallback((error: any) => {
    if (error.response?.status === 401) {
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      
      // Update Redux state
      dispatch(logoutSuccess());
      
      // Show toast
      toast.error('Session expired. Please login again.');
      
      // Navigate to login if not already there
      if (!window.location.pathname.includes('/login')) {
        navigate('/login');
      }
      
      return true; // Error was handled
    }
    
    return false; // Error was not handled
  }, [dispatch, navigate]);

  return { handleAuthError };
};