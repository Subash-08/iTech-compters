// components/AuthInitializer.tsx - UPDATED WITH WISHLIST (SAFE)
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initializeAuth } from '../redux/slices/authSlice';
import { selectToken, selectUser, selectIsAuthenticated } from '../redux/selectors';
import { loadCompleteUserProfile } from '../redux/actions/authActions';
import { cartActions } from '../redux/actions/cartActions';
import { wishlistActions } from '../redux/actions/wishlistActions'; // Add this import
import { useAuthErrorHandler } from '../components/hooks/useAuthErrorHandler';

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const existingUser = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { handleAuthError } = useAuthErrorHandler();
  
  // Use refs to track sync state
  const hasAttemptedSync = useRef(false);
  const syncInProgress = useRef(false);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!token) {
        return;
      }

      try {
        await dispatch(loadCompleteUserProfile());
        
        
        // ✅ OPTIONAL: You can enable automatic sync here if needed
        // But for now, we'll let the Cart/Wishlist components handle sync modals
        
        if (isAuthenticated && !hasAttemptedSync.current && !syncInProgress.current) {
          syncInProgress.current = true;
          hasAttemptedSync.current = true;
          
          try {
            // Sync both cart and wishlist
            await Promise.all([
              dispatch(cartActions.syncGuestCart()),
              dispatch(wishlistActions.syncGuestWishlist())
            ]);
          } catch (error) {
            console.error('❌ AuthInitializer: Automatic sync failed:', error);
          } finally {
            syncInProgress.current = false;
          }
        }
        
        
      } catch (error: any) {
        if (handleAuthError(error)) {
          return;
        }
        console.error('Failed to load user profile:', error.message);
      }
    };

    // Load data if we have token but no user data
    if (token && !existingUser) {
      loadUserData();
    }
  }, [token, existingUser, isAuthenticated, dispatch, handleAuthError]);

  // Load guest data when not authenticated
  useEffect(() => {
    if (!isAuthenticated && !token) {
      dispatch(cartActions.fetchCart());
      dispatch(wishlistActions.fetchWishlist()); // Add wishlist fetch
    }
  }, [isAuthenticated, token, dispatch]);

  // ✅ NEW: Load wishlist when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      dispatch(wishlistActions.fetchWishlist());
    }
  }, [isAuthenticated, token, dispatch]);

  return null;
};

export default AuthInitializer;