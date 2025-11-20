import React from 'react';
import { CouponFilters } from '../types/coupon';
import { Icons } from '../Icon';

interface CouponFiltersProps {
  filters: CouponFilters;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string) => void;
  onDiscountTypeFilter: (discountType: string) => void;
}

const CouponFiltersComponent: React.FC<CouponFiltersProps> = ({
  filters,
  onSearch,
  onStatusFilter,
  onDiscountTypeFilter
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Coupons
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              placeholder="Search by code or name..."
              value={filters.search}
              onChange={(e) => onSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="usage_limit_reached">Usage Limit Reached</option>
          </select>
        </div>

        {/* Discount Type Filter */}
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
            Discount Type
          </label>
          <select
            id="discountType"
            value={filters.discountType}
            onChange={(e) => onDiscountTypeFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-end">
          <p className="text-sm text-gray-600">
            Showing {filters.limit} per page
          </p>
        </div>
      </div>
    </div>
  );
};

export default CouponFiltersComponent;