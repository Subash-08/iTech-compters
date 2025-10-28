import { createSlice } from "@reduxjs/toolkit";

// Helper function to validate token
const isValidToken = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        loading: false,
        isAuthenticated: !!localStorage.getItem('token') && isValidToken(localStorage.getItem('token')),
        user: JSON.parse(localStorage.getItem('userData') || 'null'), // ✅ Load from localStorage
        token: localStorage.getItem('token'),
        error: null
    },
    reducers: {
        // Login
        loginRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        loginSuccess(state, action) {
            // Store only token in localStorage
            localStorage.setItem('token', action.payload.token);
            
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                token: action.payload.token,
                error: null
                // ❌ Don't set user here - AuthInitializer will fetch it
            }
        },
        loginFailure(state, action) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData'); // ✅ Clear user data too
            
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: action.payload
            }
        },
        
        // Register
        registerRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        registerSuccess(state, action) {
            localStorage.setItem('token', action.payload.token);
            
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                token: action.payload.token,
                error: null
                // ❌ Don't set user here - AuthInitializer will fetch it
            }
        },
        registerFailure(state, action) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData'); // ✅ Clear user data too
            
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: action.payload
            }
        },
        
        // Logout
        logoutRequest(state, action) {
            return {
                ...state,
                loading: true
            }
        },
        logoutSuccess(state, action) {
            localStorage.removeItem('token');
            localStorage.removeItem('userData'); // ✅ Clear user data too
            
            return {
                ...state,
                loading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: null
            }
        },
        
        // Initialize auth state from token
        initializeAuth(state, action) {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('userData');
            
            if (token && isValidToken(token) && userData) {
                try {
                    const user = JSON.parse(userData);
                    return {
                        ...state,
                        isAuthenticated: true,
                        user: user,
                        token: token
                    };
                } catch (error) {
                    // Invalid user data, clear everything
                    localStorage.removeItem('userData');
                    localStorage.removeItem('token');
                }
            }
            
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null
            };
        },
        
        // Set user data after fetching from profile API
        setUserData(state, action) {
            localStorage.setItem('userData', JSON.stringify(action.payload));
            
            return {
                ...state,
                user: action.payload
            }
        },
        
        // Clear errors
        clearAuthError(state, action) {
            return {
                ...state,
                error: null
            }
        },
        
        // Clear loading state
        clearAuthLoading(state, action) {
            return {
                ...state,
                loading: false
            }
        }
    }
});

export const {
    loginRequest,
    loginSuccess,
    loginFailure,
    registerRequest,
    registerSuccess,
    registerFailure,
    logoutRequest,
    logoutSuccess,
    initializeAuth,
    setUserData,
    clearAuthError,
    clearAuthLoading
} = authSlice.actions;

export default authSlice.reducer;