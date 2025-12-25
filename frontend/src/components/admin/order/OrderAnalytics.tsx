// src/components/admin/orders/OrderAnalytics.tsx

import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { OrderAnalytics as OrderAnalyticsType } from '../types/order';

const OrderAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<OrderAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAnalytics(days);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyWithDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(analytics.summary.totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">
            {analytics.summary.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrencyWithDecimal(analytics.summary.averageOrderValue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Successful Orders</h3>
          <p className="text-3xl font-bold text-green-600">
            {analytics.summary.successfulOrders}
          </p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {analytics.ordersByStatus.map((status) => (
            <div key={status._id} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{status.count}</div>
              <div className="text-sm text-gray-500 capitalize">{status._id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by Day */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Day (Last 7 Days)</h3>
        <div className="space-y-3">
          {analytics.revenueByDay.map((day) => (
            <div key={day._id} className="flex justify-between items-center">
              <span className="text-gray-600">{day._id}</span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-900">{day.orders} orders</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(day.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderAnalytics;