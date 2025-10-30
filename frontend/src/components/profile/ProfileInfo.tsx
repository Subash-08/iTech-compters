import React from 'react';
import { UserProfile } from '../../redux/actions/profileActions';
import { baseURL } from '../config/config';

interface ProfileInfoProps {
  profile: UserProfile | null;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No profile data available</div>
      </div>
    );
  }

  // Get full name from firstName and lastName
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    } else if (profile.firstName) {
      return profile.firstName.charAt(0).toUpperCase();
    } else if (profile.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Handle avatar loading error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    // The fallback div will show automatically
  };

  // Construct full avatar URL
  const getAvatarUrl = () => {
    if (!profile.avatar) return null;
    
    // If avatar is already a full URL, use it directly
    if (profile.avatar.startsWith('http')) {
      return profile.avatar;
    }
    
    // Otherwise, construct the full URL
    const baseUrl = import.meta.env.VITE_API_URL || baseURL;
    return `${baseUrl}${profile.avatar}`;
  };

  const avatarUrl = getAvatarUrl();


  return (
    <div className="space-y-6">
      {/* Profile Header with Avatar */}
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
              onError={handleImageError}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-300">
              <span className="text-2xl font-bold text-white">
                {getInitials()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{fullName || 'No Name'}</h2>
          <p className="text-gray-600">{profile.email}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.emailVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {profile.emailVerified ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Not Verified
                </>
              )}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1) || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {profile.firstName || 'Not provided'}
              </dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {profile.lastName || 'Not provided'}
              </dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {fullName || 'Not provided'}
              </dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="text-sm text-gray-900">{profile.email}</dd>
            </div>
            <div className="flex justify-between items-center py-2">
              <dt className="text-sm font-medium text-gray-500">User Role</dt>
              <dd className="text-sm text-gray-900 capitalize">{profile.role}</dd>
            </div>
          </dl>
        </div>

        {/* Account Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Account Details
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">Member since</dt>
              <dd className="text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <dt className="text-sm font-medium text-gray-500">Last updated</dt>
              <dd className="text-sm text-gray-900">
                {new Date(profile.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div className="flex justify-between items-center py-2">
              <dt className="text-sm font-medium text-gray-500">Account ID</dt>
              <dd className="text-sm text-gray-900 font-mono truncate max-w-[120px]">{profile._id}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-3 ${profile.emailVerified ? 'text-green-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
                {profile.emailVerified ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                )}
              </svg>
              <div>
                <span className="text-sm font-medium text-gray-900">Email Verification</span>
                <p className="text-sm text-gray-500">
                  {profile.emailVerified ? 'Your email has been verified' : 'Please verify your email address'}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                profile.emailVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {profile.emailVerified ? 'Verified' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-gray-900">Two-Factor Authentication</span>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Disabled
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-gray-900">Password Strength</span>
                <p className="text-sm text-gray-500">Last changed recently</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Strong
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{profile.orders?.length || 0}</div>
          <div className="text-sm text-blue-500">Orders</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{profile.wishlist?.length || 0}</div>
          <div className="text-sm text-green-500">Wishlist</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.cart?.length || 0}</div>
          <div className="text-sm text-purple-500">Cart Items</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;