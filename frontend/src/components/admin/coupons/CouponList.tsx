import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coupon, CouponFilters } from '../types/coupon';
import { couponService } from '../services/couponService';
import CouponTable from './CouponTable';
import CouponFiltersComponent from './CouponFiltersComponent';
import { Icons } from '../Icon';

const CouponList: React.FC = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<CouponFilters>({
    search: '',
    status: '',
    discountType: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await couponService.getCoupons(filters);
      setCoupons(response.coupons);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filters]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleDiscountTypeFilter = (discountType: string) => {
    setFilters(prev => ({ ...prev, discountType, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusToggle = async (couponId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await couponService.updateCouponStatus(couponId, newStatus);
      fetchCoupons(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update coupon status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      await couponService.deleteCoupon(id);
      fetchCoupons(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired' },
      usage_limit_reached: { color: 'bg-orange-100 text-orange-800', label: 'Limit Reached' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getDiscountTypeBadge = (discountType: string) => {
    const typeConfig = {
      percentage: { color: 'bg-blue-100 text-blue-800', label: 'Percentage' },
      fixed: { color: 'bg-purple-100 text-purple-800', label: 'Fixed Amount' },
      free_shipping: { color: 'bg-teal-100 text-teal-800', label: 'Free Shipping' }
    };
    
    const config = typeConfig[discountType as keyof typeof typeConfig] || typeConfig.percentage;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600">Manage discount coupons and promotions</p>
        </div>
        <button
          onClick={() => navigate('/admin/coupons/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <CouponFiltersComponent
        filters={filters}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onDiscountTypeFilter={handleDiscountTypeFilter}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Icons.Tag className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Icons.Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Icons.Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.filter(c => c.daysRemaining && c.daysRemaining <= 7).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Icons.Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow">
        <CouponTable
          coupons={coupons}
          loading={loading}
          onStatusToggle={handleStatusToggle}
          onEdit={(coupon) => navigate(`/admin/coupons/edit/${coupon._id}`)}
          onDelete={handleDelete}
          getStatusBadge={getStatusBadge}
          getDiscountTypeBadge={getDiscountTypeBadge}
        />
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CouponList;