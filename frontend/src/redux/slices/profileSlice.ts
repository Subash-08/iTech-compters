import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../actions/profileActions';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
  updateLoading: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Profile loading actions
    fetchProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.loading = false;
      state.profile = action.payload;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Profile update actions
    updateProfileStart: (state) => {
      state.updateLoading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.updateLoading = false;
      state.profile = action.payload;
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.updateLoading = false;
      state.error = action.payload;
    },

    // Password update actions
    updatePasswordStart: (state) => {
      state.updateLoading = true;
      state.error = null;
    },
    updatePasswordSuccess: (state) => {
      state.updateLoading = false;
    },
    updatePasswordFailure: (state, action: PayloadAction<string>) => {
      state.updateLoading = false;
      state.error = action.payload;
    },

    // Avatar actions
    removeAvatarSuccess: (state) => {
      if (state.profile) {
        state.profile.avatar = undefined;
      }
    },

    // Clear actions
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  updatePasswordStart,
  updatePasswordSuccess,
  updatePasswordFailure,
  removeAvatarSuccess,
  clearProfile,
  clearError,
} = profileSlice.actions;

export default profileSlice.reducer;