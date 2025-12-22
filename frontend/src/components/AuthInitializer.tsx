// components/AuthInitializer.tsx
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { initializeAuth } from '../redux/slices/authSlice';
import { selectToken, selectUser, selectIsAuthenticated } from '../redux/selectors';
import { loadCompleteUserProfile } from '../redux/actions/authActions';
import { cartActions } from '../redux/actions/cartActions';
import { wishlistActions } from '../redux/actions/wishlistActions';
import { useAuthErrorHandler } from '../components/hooks/useAuthErrorHandler';

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const existingUser = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { handleAuthError } = useAuthErrorHandler();
  
  const hasAttemptedSync = useRef(false);
  const syncInProgress = useRef(false);

  // 1. Sync Initialization (Fastest)
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // 2. Load User Profile (Critical for Auth)
  useEffect(() => {
    if (!token || existingUser) return;

    const loadUserData = async () => {
      try {
        await dispatch(loadCompleteUserProfile());
        
        // Handle Sync AFTER user loads
        if (!hasAttemptedSync.current && !syncInProgress.current) {
          syncInProgress.current = true;
          hasAttemptedSync.current = true;
          
          // 🔥 PERFORMANCE FIX: Stagger Sync Logic
          // Don't sync cart/wishlist immediately. Wait for the UI to settle.
          setTimeout(async () => {
             try {
                await Promise.all([
                  dispatch(cartActions.syncGuestCart()),
                  dispatch(wishlistActions.syncGuestWishlist())
                ]);
             } catch (error) {
                console.error('Background sync failed:', error);
             } finally {
                syncInProgress.current = false;
             }
          }, 1000); // 1 second delay after profile load
        }
      } catch (error: any) {
        if (handleAuthError(error)) return;
        console.error('Failed to load user profile:', error.message);
      }
    };

    loadUserData();
  }, [token, existingUser, dispatch, handleAuthError]);

  // 3. Guest Data (Non-Critical - Staggered)
  useEffect(() => {
    if (!isAuthenticated && !token) {
      // 🔥 PERFORMANCE FIX: Delay guest fetches
      const timer = setTimeout(() => {
        dispatch(cartActions.fetchCart());
        // Wishlist is even less critical, fetch it slightly after cart
        setTimeout(() => {
            dispatch(wishlistActions.fetchWishlist());
        }, 500); 
      }, 500); // 500ms delay after mount

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, dispatch]);

  // 4. Authenticated Data Refresh
  useEffect(() => {
    if (isAuthenticated && token) {
       // Stagger this too
       const timer = setTimeout(() => {
          dispatch(wishlistActions.fetchWishlist());
       }, 1500);
       return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token, dispatch]);

  return null;
};

export default AuthInitializer;