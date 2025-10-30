import React, { useState, useRef } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { profileActions } from '../../redux/actions/profileActions';
import { UserProfile } from '../../redux/actions/profileActions';
import { baseURL } from '../config/config';

interface ProfileEditProps {
  profile: UserProfile | null;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ profile }) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
  });
  
  // Get current avatar URL for preview
  const getCurrentAvatarUrl = () => {
    if (!profile?.avatar) return '';
    
    if (profile.avatar.startsWith('http')) {
      return profile.avatar;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || baseURL;
    return `${baseUrl}${profile.avatar}`;
  };

  const [avatarPreview, setAvatarPreview] = useState(getCurrentAvatarUrl());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    dispatch(profileActions.removeAvatar() as any);
    setAvatarPreview('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('firstName', formData.firstName);
    submitData.append('lastName', formData.lastName);
    submitData.append('email', formData.email);
    
    if (selectedFile) {
      submitData.append('avatar', selectedFile);
    }

    dispatch(profileActions.updateProfile(submitData) as any);
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase();
    } else if (formData.firstName) {
      return formData.firstName.charAt(0).toUpperCase();
    } else if (formData.email) {
      return formData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Handle avatar image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
        
        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                  onError={handleImageError}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xl font-bold text-white">
                    {getInitials()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change
              </button>
              {(avatarPreview || profile?.avatar) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            JPG, PNG, GIF or WebP. Max size 2MB.
          </p>
        </div>

        {/* First Name Field */}
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Last Name Field */}
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            disabled={true}
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Display Full Name Preview */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Full Name Preview
          </label>
          <p className="text-sm text-gray-900 font-medium">
            {`${formData.firstName} ${formData.lastName}`.trim() || 'No name provided'}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Update Profile
        </button>
      </div>
    </form>
  );
};

export default ProfileEdit;