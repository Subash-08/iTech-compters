import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { Icons } from '../Icon';

const UserInsights: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await dashboardService.getUserAnalytics();
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Insights</h3>
        <Icons.Users className="w-5 h-5 text-gray-600" />
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/30">
          <div className="text-2xl font-bold text-blue-700">{userData?.totalUsers || 0}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/30">
          <div className="text-2xl font-bold text-green-700">{userData?.activeUsers || 0}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 border border-purple-200/30">
          <div className="text-2xl font-bold text-purple-700">{userData?.newUsers || 0}</div>
          <div className="text-sm text-purple-600">New This Month</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/30">
          <div className="text-2xl font-bold text-orange-700">{userData?.verifiedUsers || 0}</div>
          <div className="text-sm text-orange-600">Verified</div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">User Distribution</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span>Verified Users</span>
            <span className="font-medium text-green-600">
              {userData?.verifiedUsers || 0} ({((userData?.verifiedUsers / userData?.totalUsers) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${((userData?.verifiedUsers / userData?.totalUsers) * 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span>Active Users (30 days)</span>
            <span className="font-medium text-blue-600">
              {userData?.activeUsers || 0} ({((userData?.activeUsers / userData?.totalUsers) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${((userData?.activeUsers / userData?.totalUsers) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/30">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">New Users Today</span>
          <span className="font-semibold text-purple-700">{userData?.newUsersToday || 0}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">Users with Orders</span>
          <span className="font-semibold text-green-700">{userData?.usersWithOrders || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default UserInsights;