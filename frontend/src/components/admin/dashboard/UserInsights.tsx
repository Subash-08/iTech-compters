import React from 'react';
import { Users, UserCheck, UserPlus, TrendingUp, BarChart } from 'lucide-react';

interface UserInsightsProps {
  data?: any;
  loading?: boolean;
}

const UserInsights: React.FC<UserInsightsProps> = ({ data, loading = false }) => {
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

  // Safe data access with fallbacks
  const totalUsers = data?.totalUsers || 0;
  const activeUsers = data?.activeUsers || 0;
  const newUsers = data?.newUsers || 0;
  const verifiedUsers = data?.verifiedUsers || 0;
  const unverifiedUsers = data?.unverifiedUsers || 0;
  const usersWithOrders = data?.usersWithOrders || 0;
  const returningRate = data?.returningRate || 0;
  const topCustomers = data?.topCustomers || [];

  // Calculate percentages safely
  const verifiedPercentage = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;
  const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const usersWithOrdersPercentage = totalUsers > 0 ? (usersWithOrders / totalUsers) * 100 : 0;

  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Insights</h3>
        <Users className="w-5 h-5 text-gray-600" />
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/30">
          <div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
          <div className="text-sm text-blue-600 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Total Users
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/30">
          <div className="text-2xl font-bold text-green-700">{activeUsers}</div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Active (30d)
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 border border-purple-200/30">
          <div className="text-2xl font-bold text-purple-700">{newUsers}</div>
          <div className="text-sm text-purple-600 flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            New Users
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/30">
          <div className="text-2xl font-bold text-orange-700">{verifiedUsers}</div>
          <div className="text-sm text-orange-600 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Verified
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <BarChart className="w-4 h-4" />
          User Distribution
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Verified Users</span>
              <span className="font-medium text-green-600">
                {verifiedUsers} ({verifiedPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${verifiedPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Active Users (30 days)</span>
              <span className="font-medium text-blue-600">
                {activeUsers} ({activePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${activePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Users with Orders</span>
              <span className="font-medium text-purple-600">
                {usersWithOrders} ({usersWithOrdersPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                style={{ width: `${usersWithOrdersPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Returning Customer Rate */}
      <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg border border-indigo-200/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-indigo-600">Returning Customer Rate</div>
            <div className="text-2xl font-bold text-indigo-700">
              {returningRate.toFixed(1)}%
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="text-xs text-indigo-600">
          Percentage of customers who made repeat purchases
        </div>
      </div>

      {/* Top Customers (if available) */}
      {topCustomers.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Top Customers</h4>
          {topCustomers.slice(0, 2).map((customer: any, index: number) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200/30"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {customer.name || customer.email}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {customer.email}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-700 text-sm">
                  ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500">
                  {customer.totalOrders || 0} orders
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserInsights;