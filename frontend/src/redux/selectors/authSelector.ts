import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Base selectors
const selectAuthState = (state: RootState) => state.authState;

// Auth selectors
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (authState) => authState.isAuthenticated
);

export const selectUser = createSelector(
  [selectAuthState],
  (authState) => authState.user
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (authState) => authState.loading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (authState) => authState.error
);

export const selectToken = createSelector(
  [selectAuthState],
  (authState) => authState.token
);

// Combined selectors
export const selectUserInitials = createSelector(
  [selectUser],
  (user) => {
    if (!user) return '';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }
);

export const selectUserFullName = createSelector(
  [selectUser],
  (user) => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
);

