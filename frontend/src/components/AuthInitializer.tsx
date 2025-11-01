// components/AuthInitializer.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initializeAuth } from '../redux/slices/authSlice';
import { selectToken, selectUser } from '../redux/selectors';
import { loadCompleteUserProfile } from '../redux/actions/authActions';
import { useAuthErrorHandler } from '../components/hooks/useAuthErrorHandler';

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const existingUser = useAppSelector(selectUser);
  const { handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!token) return;

      try {
        // ✅ Use the new complete profile loader
        await dispatch(loadCompleteUserProfile());
      } catch (error: any) {
        // ✅ Handle auth errors specifically
        if (handleAuthError(error)) {
          return; // Stop execution if it was an auth error
        }
        console.error('Failed to load user profile:', error.message);
      }
    };

    // ✅ Load data if we have token but no user data
    if (token && !existingUser) {
      loadUserData();
    }
  }, [token, existingUser, dispatch, handleAuthError]);

  return null;
};

export default AuthInitializer;