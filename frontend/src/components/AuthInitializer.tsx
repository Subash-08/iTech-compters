import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initializeAuth, setAuthLoading } from '../redux/slices/authSlice';
import { selectToken, selectUser, selectAuthInitialized } from '../redux/selectors';
import { loadCompleteUserProfile } from '../redux/actions/authActions';

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const existingUser = useAppSelector(selectUser);
  const authInitialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    // Only initialize once
    if (!authInitialized) {
      console.log('🔄 AuthInitializer: Initializing auth...');
      dispatch(initializeAuth());
    }
  }, [dispatch, authInitialized]);

  useEffect(() => {
    const loadUserData = async () => {
      // Don't load if no token or auth not initialized
      if (!token || !authInitialized) {
        return;
      }

      try {
        console.log('🔄 AuthInitializer: Loading user data...');
        dispatch(setAuthLoading(true));
        
        // Only load user data if we have token but no user data
        if (token && !existingUser) {
          const result = await dispatch(loadCompleteUserProfile());
          console.log('✅ AuthInitializer: User data loaded:', result);
        } else if (existingUser) {
          console.log('ℹ️ AuthInitializer: User data already exists');
        }
      } catch (error: any) {
        console.error('❌ AuthInitializer: Failed to load user profile:', error.message);
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    loadUserData();
  }, [token, authInitialized, existingUser, dispatch]);

  return null;
};

export default AuthInitializer;