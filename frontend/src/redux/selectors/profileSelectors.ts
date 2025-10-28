import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Base selectors
const selectProfileState = (state: RootState) => state.profileState;

// Base profile selectors
export const selectProfile = createSelector(
  [selectProfileState],
  (profileState) => profileState.profile
);

export const selectProfileLoading = createSelector(
  [selectProfileState],
  (profileState) => profileState.loading
);

export const selectProfileError = createSelector(
  [selectProfileState],
  (profileState) => profileState.error
);

export const selectProfileUpdateLoading = createSelector(
  [selectProfileState],
  (profileState) => profileState.updateLoading
);

// Derived profile selectors
export const selectUserAvatar = createSelector(
  [selectProfile],
  (profile) => profile?.avatar
);

export const selectUserName = createSelector(
  [selectProfile],
  (profile) => profile?.name || ''
);

export const selectUserEmail = createSelector(
  [selectProfile],
  (profile) => profile?.email || ''
);

export const selectUserRole = createSelector(
  [selectProfile],
  (profile) => profile?.role || 'user'
);

export const selectIsVerified = createSelector(
  [selectProfile],
  (profile) => profile?.isVerified || false
);

export const selectUserCreatedAt = createSelector(
  [selectProfile],
  (profile) => profile?.createdAt || ''
);

export const selectUserUpdatedAt = createSelector(
  [selectProfile],
  (profile) => profile?.updatedAt || ''
);

// Complex profile selectors
export const selectProfileCompletion = createSelector(
  [selectProfile],
  (profile) => {
    if (!profile) return 0;

    let completion = 0;
    const totalFields = 4; // name, email, avatar, verification

    if (profile.name && profile.name.trim().length > 0) completion++;
    if (profile.email && profile.email.trim().length > 0) completion++;
    if (profile.avatar) completion++;
    if (profile.isVerified) completion++;

    return Math.round((completion / totalFields) * 100);
  }
);

export const selectProfileFormattedDate = createSelector(
  [selectProfile],
  (profile) => {
    if (!profile) return { joined: 'N/A', updated: 'N/A' };

    return {
      joined: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A',
      updated: profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A'
    };
  }
);

export const selectProfileSecurityStatus = createSelector(
  [selectProfile],
  (profile) => {
    if (!profile) return { emailVerified: false, twoFactorEnabled: false };

    return {
      emailVerified: profile.isVerified || false,
      twoFactorEnabled: false // You can add 2FA to your user model later
    };
  }
);

export const selectIsProfileLoaded = createSelector(
  [selectProfileLoading, selectProfile],
  (loading, profile) => {
    return !loading && profile !== null;
  }
);

export const selectProfileHasAvatar = createSelector(
  [selectProfile],
  (profile) => {
    return !!profile?.avatar?.url;
  }
);

export const selectProfileInitials = createSelector(
  [selectProfile],
  (profile) => {
    if (!profile?.name) return 'U';
    
    return profile.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
);

// Admin selectors
export const selectIsAdmin = createSelector(
  [selectProfile],
  (profile) => {
    return profile?.role === 'admin';
  }
);

export const selectCanManageUsers = createSelector(
  [selectProfile],
  (profile) => {
    const role = profile?.role;
    return role === 'admin' || role === 'moderator';
  }
);