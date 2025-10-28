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
    setUserData
} from '../slices/authSlice';
import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig'; // ✅ Import axios config

// Debug version to find the recursive call
export const clearError = () => {
    console.log('🔧 clearError action called');
    return clearAuthError();
};

export const login = (email: string, password: string) => {
    return async (dispatch: any) => {
        console.log('🔧 login action started');
        
        try {
            console.log('🔧 Dispatching loginRequest');
            dispatch(loginRequest());
            console.log('🔧 loginRequest dispatched successfully');

            console.log('🔧 Making API call with axios...');
            const response = await api.post('/login', { 
                email, 
                password 
            });

            console.log('🔧 API response:', response.data);

            if (response.data.success) {
                console.log('🔧 Login successful, storing token');
                localStorage.setItem('token', response.data.token);
                
                console.log('🔧 Dispatching loginSuccess');
                dispatch(loginSuccess({
                    token: response.data.token // ✅ Only token, no user data
                }));

                // ✅ Show success toast
                toast.success(response.data.message || 'Login successful!');
                
                return { success: true };
            } else {
                console.log('🔧 Login failed, dispatching failure');
                // ✅ Show error toast
                toast.error(response.data.message || 'Login failed');
                dispatch(loginFailure(response.data.message || 'Login failed'));
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            console.log('🔧 Login error:', error);
            
            // Extract error message from axios response
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            
            // ✅ Show error toast
            toast.error(errorMessage);
            dispatch(loginFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    };
};

// Register action with axios and FormData support
export const register = (userData: FormData | any) => {
    return async (dispatch: any) => {
        try {
            dispatch(registerRequest());

            let response;
            
            if (userData instanceof FormData) {
                // For FormData (with avatar), use multipart/form-data
                response = await api.post('/register', userData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // For regular JSON data
                response = await api.post('/register', userData);
            }

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                
                dispatch(registerSuccess({
                    token: response.data.token // ✅ Only token, no user data
                }));

                // ✅ Show success toast
                toast.success(response.data.message || 'Registration successful!');
                
                return { success: true };
            } else {
                // ✅ Show error toast
                toast.error(response.data.message || 'Registration failed');
                dispatch(registerFailure(response.data.message || 'Registration failed'));
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            // Extract error message from axios response
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            
            // ✅ Show error toast
            toast.error(errorMessage);
            dispatch(registerFailure(errorMessage));
            return { success: false, error: errorMessage };
        }
    };
};

// Logout action with axios
export const logout = () => {
    return async (dispatch: any) => {
        try {
            dispatch(logoutRequest());
            
            // Try to call logout API
            await api.post('/logout');
            
        } catch (error: any) {
            // Silent catch - logout should proceed even if API call fails
            console.log('Logout API call failed, proceeding with client-side logout:', error.message);
        } finally {
            // Always clear local storage and dispatch success
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            dispatch(logoutSuccess());

            // ✅ Show success toast
            toast.success('Logged out successfully');
            
            return { success: true };
        }
    };
};

// Load user profile with axios (for AuthInitializer)
export const loadUserProfile = () => {
    return async (dispatch: any) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { success: false, error: 'No token found' };
            }

            const response = await api.get('/profile');

            if (response.data.success) {
                // ✅ Use setUserData to store user information
                dispatch(setUserData(response.data.user));
                return { success: true, user: response.data.user };
            } else {
                // Invalid token or user not found
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            console.error('Failed to load user profile:', error);
            
            // Extract error message
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load user profile';
            
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            return { success: false, error: errorMessage };
        }
    };
};

// Optional: Update user profile
export const updateUserProfile = (userData: any) => {
    return async (dispatch: any) => {
        try {
            const response = await api.put('/profile', userData, {
                headers: userData instanceof FormData ? 
                    { 'Content-Type': 'multipart/form-data' } : 
                    { 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                dispatch(setUserData(response.data.user));
                toast.success('Profile updated successfully!');
                return { success: true, user: response.data.user };
            } else {
                toast.error(response.data.message || 'Failed to update profile');
                return { success: false, error: response.data.message };
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    };
};