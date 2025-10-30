import { createSlice } from "@reduxjs/toolkit";

// Helper function to validate token
const isValidToken = (token: string | null) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  error: string | null;
  initialized: boolean; // ✅ NEW: Critical for auth flow
}

const initialState: AuthState = {
  loading: false,
  isAuthenticated: false, // ✅ Start as false, will be set by initializeAuth
  user: null,
  token: null,
  error: null,
  initialized: false // ✅ NEW: Track if auth has been initialized
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login
    loginRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      localStorage.setItem('token', action.payload.token);
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user || null;
      state.error = null;
    },
    loginFailure(state, action) {
      localStorage.removeItem('token');
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    
    // Register
    registerRequest(state) {
      state.loading = true;
      state.error = null;
    },
    registerSuccess(state, action) {
      localStorage.setItem('token', action.payload.token);
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user || null;
      state.error = null;
    },
    registerFailure(state, action) {
      localStorage.removeItem('token');
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    
    // Logout
    logoutRequest(state) {
      state.loading = true;
    },
    logoutSuccess(state) {
      localStorage.removeItem('token');
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.initialized = true;
    },
    
    // ✅ UPDATED: Initialize auth state from token
    initializeAuth(state) {
      const token = localStorage.getItem('token');
      
      if (token && isValidToken(token)) {
        state.isAuthenticated = true;
        state.token = token;
      } else {
        // Clear invalid token
        localStorage.removeItem('token');
        state.isAuthenticated = false;
        state.token = null;
      }
      state.initialized = true; // ✅ Mark as initialized
    },
    
    // Set complete user data
    setCompleteUserData(state, action) {
      state.user = action.payload.user;
    },
    
    // Update user profile
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    },
    
    // ✅ NEW: Set auth loading
    setAuthLoading(state, action) {
      state.loading = action.payload;
    },
    
    // Clear errors
    clearAuthError(state) {
      state.error = null;
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
  setCompleteUserData,
  updateUserProfile,
  setAuthLoading, // ✅ NEW
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer;