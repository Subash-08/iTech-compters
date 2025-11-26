import React from 'react';
import { User } from '../types/user';
import StatusBadge from '../common/StatusBadge';
import { Icons } from '../Icon';
import { baseURL } from '../../config/config';
import { useNavigate } from 'react-router-dom';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onStatusChange: (id: string, status: 'active' | 'inactive') => void;
  onRoleChange: (id: string, role: 'user' | 'admin') => void;
  loading?: boolean;
  currentUserId?: string; // Add current user ID to exclude
}

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return null;
  
  // If avatar is already a full URL, use it directly
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Otherwise, construct the full URL
  const baseUrl = import.meta.env.VITE_API_URL || baseURL;
  // Remove duplicate slashes if any
  return `${baseUrl.replace(/\/$/, '')}/${avatarPath.replace(/^\//, '')}`;
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onStatusChange,
  onRoleChange,
  loading = false,
  currentUserId
}) => {
   const navigate = useNavigate();
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      user: { label: 'User', className: 'bg-blue-100 text-blue-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Safe getter for user avatar initial
  const getAvatarInitial = (user: User) => {
    if (!user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  // Safe getter for user display name
  const getDisplayName = (user: User) => {
    return user.name || user.firstName || 'Unknown User';
  };

  // Safe getter for user email
  const getDisplayEmail = (user: User) => {
    return user.email || 'No email';
  };

  // Filter out current user from the list
  const filteredUsers = currentUserId 
    ? users.filter(user => user._id !== currentUserId)
    : users;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <Icons.Loader className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {currentUserId && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">
            <Icons.Info className="w-4 h-4 inline mr-1" />
            Your account is not shown in this list for security reasons.
          </p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const avatarUrl = getAvatarUrl(user.avatar);
              
              return (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {avatarUrl ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={avatarUrl}
                            alt={getDisplayName(user)}
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show the fallback avatar
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center';
                                fallback.innerHTML = `<span class="text-white font-medium text-sm">${getAvatarInitial(user)}</span>`;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {getAvatarInitial(user)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getDisplayName(user)}
                          {user._id === currentUserId && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getDisplayEmail(user)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role || 'user')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status || 'active'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Role Change Dropdown */}
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => onRoleChange(user._id, e.target.value as 'user' | 'admin')}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={user._id === currentUserId}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Status Toggle */}
                      <button
                        onClick={() => onStatusChange(user._id, user.status === 'active' ? 'inactive' : 'active')}
                        disabled={user._id === currentUserId}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (user.status || 'active') === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${user._id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {(user.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
          onClick={() => navigate(`/admin/users/${user._id}`)} // ✅ CHANGED
          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
          title="View full details"
        >
          <Icons.Eye className="w-4 h-4" />
        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;