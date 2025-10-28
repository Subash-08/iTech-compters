import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand, BrandFilters } from '../types/brand';
import { brandService } from '../services/brandService';
import BrandTable from './BrandTable';
import BrandFiltersComponent from './BrandFiltersComponent';
import { Icons } from '../Icon';

const BrandList: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<BrandFilters>({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await brandService.getBrands(filters, true);
      setBrands(response.brands);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [filters]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusToggle = async (brandId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await brandService.updateBrandStatus(brandId, newStatus);
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update brand status');
    }
  };

  const handleDelete = async (slug: string) => {


    try {
      await brandService.deleteBrand(slug);
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage your product brands</p>
        </div>
        <button
          onClick={() => navigate('/admin/brands/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <BrandFiltersComponent
        filters={filters}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
      />

      {/* Brands Table */}
      <div className="bg-white rounded-lg shadow">
        <BrandTable
          brands={brands}
          loading={loading}
          onStatusToggle={handleStatusToggle}
          onEdit={(brand) => navigate(`/admin/brands/edit/${brand.slug}`)}
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

export default BrandList;