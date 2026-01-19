// components/admin/featured-brands/FeaturedBrandList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeaturedBrand, FeaturedBrandFilters } from '../types/featuredBrand';
import { featuredBrandService } from '../services/featuredBrandService';
import FeaturedBrandTable from './FeaturedBrandTable';
// import FeaturedBrandFiltersComponent from './FeaturedBrandFiltersComponent';
import { Icons } from '../Icon';

const FeaturedBrandList: React.FC = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FeaturedBrandFilters>({
    search: '',
    status: '',
    page: 1,
    limit: 20
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await featuredBrandService.getAdminFeaturedBrands(filters);
      setBrands(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch featured brands');
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

  const handleStatusToggle = async (brandId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await featuredBrandService.updateFeaturedBrandStatus(brandId, newStatus);
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update brand status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this featured brand?')) return;
    
    try {
      await featuredBrandService.deleteFeaturedBrand(id);
      fetchBrands(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete featured brand');
    }
  };

  const handleDisplayOrderUpdate = async (orderedBrands: FeaturedBrand[]) => {
    try {
      const updateData = orderedBrands.map((brand, index) => ({
        id: brand._id,
        order: index
      }));
      
      await featuredBrandService.updateDisplayOrder(updateData);
      setBrands(orderedBrands);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update display order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Featured Brands Management</h1>
          <p className="text-gray-600">Manage brands displayed in the "Trusted by Leading Brands" section</p>
          <div className="mt-2 text-sm text-gray-500">
            <strong>Logo Requirements:</strong> 300x150px, PNG/SVG format, 5MB max, white/transparent background
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/featured-brands/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Add Featured Brand</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icons.Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">How to use this section:</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Add logos of brands you partner with to display in the "Trusted by Leading Brands" section</li>
              <li>Drag and drop brands to reorder them (higher brands appear first)</li>
              <li>Recommended logo size: 300x150 pixels with white or transparent background</li>
              <li>Use PNG or SVG format for best quality</li>
              <li>Section will only appear on the website if there are active brands with logos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-4 text-sm underline hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      {/* <FeaturedBrandFiltersComponent
        filters={filters}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
      /> */}

      {/* Brands Table */}
      <div className="bg-white rounded-lg shadow">
        <FeaturedBrandTable
          brands={brands}
          loading={loading}
          onStatusToggle={handleStatusToggle}
          onEdit={(brand) => navigate(`/admin/featured-brands/edit/${brand._id}`)}
          onDelete={handleDelete}
          onDisplayOrderUpdate={handleDisplayOrderUpdate}
        />
      </div>
    </div>
  );
};

export default FeaturedBrandList;