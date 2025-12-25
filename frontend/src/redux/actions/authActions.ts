// actions/authActions.ts - COMPLETELY REPLACE THIS FILE
import {
    loginRequest,
    loginSuccess,
    loginFailure,
    registerRequest,
    registerSuccess,
    registerFailure,
    logoutRequest,
    logoutSuccess,
    clearAuthError,
    setCompleteUserData,
    googleLoginSuccess,
    googleLoginFailure,
    googleLoginRequest
} from '../slices/authSlice';
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';

export const clearError = () => {
    return clearAuthError();
};

// ✅ FIXED: Load complete user profile with proper wishlist data
export const loadCompleteUserProfile = () => async (dispatch: any) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        const response = await api.get('/user/complete-profile');        
        if (response.data.success) {
            const { user, cart, wishlist, recentOrders } = response.data.data;

            // ✅ Set complete user data in auth slice
            dispatch(setCompleteUserData({ user }));

            // ✅ Set cart data in cart slice
            dispatch({
                type: 'cart/fetchCartSuccess',
                payload: cart?.items || []
            });
            dispatch({
                type: 'wishlist/fetchWishlistSuccess',
                payload: {
                    items: wishlist?.items || [], // ✅ This contains products with prices
                    isGuest: false
                }
            });

            // ✅ Set orders data in order slice (if you have one)
            dispatch({
                type: 'order/setRecentOrders',
                payload: recentOrders || []
            });

            return { 
                success: true, 
                data: { user, cart, wishlist, recentOrders } 
            };
        } else {
            localStorage.removeItem('token');
            return { success: false, error: response.data.message };
        }
    } catch (error: any) {
        console.error('Failed to load complete user profile:', error);
        
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load user profile';
        
        // Clear invalid tokens
        localStorage.removeItem('token');
        return { success: false, error: errorMessage };
    }
};

// ✅ UPDATED: Login with complete profile loading
export const login = (email: string, password: string) => {
    return async (dispatch: any) => {
        try {
            dispatch(loginRequest());

            const response = await api.post('/login', { email, password });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                
                dispatch(loginSuccess({
                    token: response.data.token
                }));

                // ✅ Load complete user profile after login
                const profileResult = await dispatch(loadCompleteUserProfile());
                
toast.success(response.data.message || 'Login successful!');
                return { success: true }
            } else {
                toast.error(response.data.message || 'Login failed');
                dispatch(loginFailure(response.data.message || 'Login failed'));
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            toast.error(errorMessage);
            dispatch(loginFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    };
};

// ✅ UPDATED: Register with complete profile loading  
export const register = (userData: FormData | any) => {
    return async (dispatch: any) => {
        try {
            dispatch(registerRequest());

            let response;
            
            if (userData instanceof FormData) {
                response = await api.post('/register', userData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('/register', userData);
            }

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                
                dispatch(registerSuccess({
                    token: response.data.token
                }));

                // ✅ Load complete user profile after registration
                await dispatch(loadCompleteUserProfile());

                toast.success(response.data.message || 'Registration successful!');
                return { success: true };
            } else {
                toast.error(response.data.message || 'Registration failed');
                dispatch(registerFailure(response.data.message || 'Registration failed'));
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            toast.error(errorMessage);
            dispatch(registerFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    };
};

// Logout remains the same
export const logout = () => {
    return async (dispatch: any) => {
        try {
            dispatch(logoutRequest());
            await api.post('/logout');
        } catch (error: any) {
        } finally {
            localStorage.removeItem('token');
            dispatch(logoutSuccess());
            toast.success('Logged out successfully');
            return { success: true };
        }
    };
};

// redux/actions/authActions.ts - FIX RETURN VALUE
export const googleLogin = (credential: string) => {
    return async (dispatch: any) => {
        try {
            dispatch(googleLoginRequest());
            const response = await api.post('/google', { 
                credential: credential
            });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                dispatch(googleLoginSuccess({ token: response.data.token }));

                // ✅ Load user profile
                const profileResult = await dispatch(loadCompleteUserProfile());
                
                if (profileResult.success) {
                    toast.success('Google login successful!');
                    return { success: true, data: response.data }; // ✅ Return success with data
                } else {
                    return { success: false, error: 'Failed to load user profile' };
                }
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            console.error('❌ Google login error:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Google authentication failed';
            toast.error(errorMessage);
            dispatch(googleLoginFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    };
};