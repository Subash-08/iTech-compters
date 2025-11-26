// src/components/admin/orders/OrderFilters.tsx

import React from 'react';
import { OrderFilters as OrderFiltersType } from '../types/order';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFilterChange: (filters: OrderFiltersType) => void;
  onRefresh: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  onRefresh
}) => {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'captured', label: 'Captured' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const handleInputChange = (key: keyof OrderFiltersType, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    onFilterChange({ ...filters, [type]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      page: 1,
      limit: 10,
      status: '',
      paymentStatus: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Orders
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Order # or Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus || ''}
            onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {paymentStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Date Range
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear Filters
        </button>
        
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;