import { toast } from 'react-toastify';
import api from '../../components/config/axiosConfig';
import { updateUserProfile } from '../slices/authSlice';

// Types
export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  emailVerified: boolean; 
  status: string;
  wishlist: any[];
  orders: any[];
  cart: any[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: File;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

// API Calls with error handling
export const profileAPI = {
  // Get user profile
  getProfile: async (): Promise<{ user: UserProfile }> => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch profile';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Update profile
  updateProfile: async (profileData: FormData): Promise<{ user: UserProfile }> => {
    try {
      const response = await api.put('/profile', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Update password
  updatePassword: async (passwordData: UpdatePasswordData): Promise<{ message: string }> => {
    try {
      const response = await api.put('/password/update', passwordData);
      toast.success('Password updated successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update password';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Remove avatar
  removeAvatar: async (): Promise<{ user: UserProfile }> => {
    try {
      const response = await api.delete('/profile/avatar');
      toast.success('Avatar removed successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove avatar';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
};

// Action creators that can be dispatched directly
export const profileActions = {
  // Fetch user profile
  fetchUserProfile: () => async (dispatch: any) => {
    try {
      dispatch({ type: 'profile/fetchProfileStart' });
      const response = await profileAPI.getProfile();
      dispatch({
        type: 'profile/fetchProfileSuccess',
        payload: response.user,
      });
    } catch (error: any) {
      dispatch({
        type: 'profile/fetchProfileFailure',
        payload: error.message,
      });
    }
  },

  // Update profile
updateProfile: (profileData: FormData) => async (dispatch: any) => {
  try {
    dispatch({ type: 'profile/updateProfileStart' });
    const response = await profileAPI.updateProfile(profileData);
    
    // Update profile state
    dispatch({
      type: 'profile/updateProfileSuccess',
      payload: response.user,
    });

    // ALSO update auth state
    dispatch(updateUserProfile(response.user));

  } catch (error: any) {
    dispatch({
      type: 'profile/updateProfileFailure',
      payload: error.message,
    });
  }
},

  // Update password
  updatePassword: (passwordData: UpdatePasswordData) => async (dispatch: any) => {
    try {
      dispatch({ type: 'profile/updatePasswordStart' });
      await profileAPI.updatePassword(passwordData);
      dispatch({ type: 'profile/updatePasswordSuccess' });
    } catch (error: any) {
      dispatch({
        type: 'profile/updatePasswordFailure',
        payload: error.message,
      });
    }
  },

  // Remove avatar
  removeAvatar: () => async (dispatch: any) => {
    try {
      const response = await profileAPI.removeAvatar();
      dispatch({
        type: 'profile/removeAvatarSuccess',
        payload: response.user,
      });
    } catch (error: any) {
      // Error is already handled in profileAPI.removeAvatar
    }
  },

  // Clear error
  clearError: () => ({
    type: 'profile/clearError',
  }),

  // Clear profile
  clearProfile: () => ({
    type: 'profile/clearProfile',
  }),
};