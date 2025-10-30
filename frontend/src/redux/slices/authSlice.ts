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
        user: null, // ✅ REMOVED localStorage userData
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
            // ✅ Store only token
            localStorage.setItem('token', action.payload.token);
            
            return {
                ...state,
                loading: false,
                isAuthenticated: true,
                token: action.payload.token,
                user: null, // ✅ Will be set by complete profile fetch
                error: null
            }
        },
        loginFailure(state, action) {
            localStorage.removeItem('token');
            
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
                user: null, // ✅ Will be set by complete profile fetch
                error: null
            }
        },
        registerFailure(state, action) {
            localStorage.removeItem('token');
            
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
            
            if (token && isValidToken(token)) {
                return {
                    ...state,
                    isAuthenticated: true,
                    token: token,
                    user: null // ✅ User data will be fetched separately
                };
            }
            
            // Clear invalid token
            localStorage.removeItem('token');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null
            };
        },
        
        // ✅ NEW: Set complete user data (user + cart + wishlist + orders)
        setCompleteUserData(state, action) {
            return {
                ...state,
                user: action.payload.user
            }
        },
        
        // ✅ NEW: Update only user profile (for profile updates)
        updateUserProfile: (state, action) => {
            if (state.user) {
                return {
                    ...state,
                    user: {
                        ...state.user,
                        ...action.payload
                    }
                };
            }
            return state;
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
    setCompleteUserData, // ✅ NEW
    updateUserProfile,   // ✅ UPDATED
    clearAuthError,
    clearAuthLoading
} = authSlice.actions;

export default authSlice.reducer;