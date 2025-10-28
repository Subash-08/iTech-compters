// components/AuthInitializer.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initializeAuth } from '../redux/slices/authSlice';
import { selectToken, selectUser } from '../redux/selectors';
import { loadUserProfile } from '../redux/actions/authActions';

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const existingUser = useAppSelector(selectUser);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!token) return;

      try {
        console.log('🔄 Fetching user data from profile API...');
        const result = await dispatch(loadUserProfile());
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        console.log('✅ User data loaded successfully');
      } catch (error: any) {
        console.error('❌ Failed to load user profile:', error.message);
        // The axios interceptor will handle redirects for 401 errors
      }
    };

    // Load user data if we have token but no user data
    if (token && !existingUser) {
      loadUserData();
    }
  }, [token, existingUser, dispatch]);

  return null;
};

export default AuthInitializer;