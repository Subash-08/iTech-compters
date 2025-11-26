import React, { useState, useEffect } from 'react';
import { User, UserFilters } from '../types/user';
import { userService } from '../services/userService';
import UserFiltersComponent from './UserFiltersComponent';
import UserTable from './UserTable';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import { Icons } from '../Icon';

// Redux imports
import { useAppSelector } from '../../../redux/hooks';
import { selectUser } from '../../../redux/selectors';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string>('');

  // Get current user from Redux
  const currentUser = useAppSelector(selectUser);
  const currentUserId = currentUser?._id;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUsers(filters);
      setUsers(response.users || []);
      setTotalCount(response.count || 0);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive') => {
    try {
      await userService.updateUserStatus(id, { status });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleRoleChange = async (id: string, role: 'user' | 'admin') => {
    try {
      await userService.updateUserRole(id, { role });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError('Failed to update user role');
      console.error('Error updating user role:', err);
    }
  };

  const handleEdit = (user: User) => {
    // You can implement a modal or navigation here
  };

  // Calculate display count (excluding current user)
  const displayCount = currentUserId 
    ? users.filter(user => user._id !== currentUserId).length
    : users.length;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <Icons.AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor user accounts</p>
          {currentUserId && (
            <p className="text-sm text-blue-600 mt-1">
              <Icons.Info className="w-4 h-4 inline mr-1" />
              Your account is managed separately for security
            </p>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Showing: {displayCount} users
          {currentUserId && totalCount > displayCount && (
            <span className="text-blue-600"> (excluding your account)</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Users Table */}
      {displayCount === 0 && !loading ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or filters to find what you're looking for."
          icon={<Icons.Users className="w-12 h-12 text-gray-400" />}
        />
      ) : (
        <>
<UserTable
  users={users}
  onEdit={() => {}} // Keep for now or remove from props if not needed
  onStatusChange={handleStatusChange}
  onRoleChange={handleRoleChange}
  loading={loading}
  currentUserId={currentUserId}
/>

          {/* Pagination */}
          {totalCount > (filters.limit || 10) && (
            <Pagination
              currentPage={filters.page || 1}
              totalItems={totalCount}
              itemsPerPage={filters.limit || 10}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserList;