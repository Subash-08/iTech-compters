// src/components/admin/prebuilt-pcs/PreBuiltPCList.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Computer, 
  Loader, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  CheckCircle, 
  Star,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { preBuiltPCService, PreBuiltPC, PreBuiltPCFilters } from '../services/preBuiltPCService';
import { baseURL } from '../../config/config';

const PreBuiltPCList: React.FC = () => {
  const [preBuiltPCs, setPreBuiltPCs] = useState<PreBuiltPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PreBuiltPCFilters>({
    search: '',
    category: '',
    status: '',
    page: 1,
    limit: 12
  });
  
  useEffect(() => {
    loadPreBuiltPCs();
  }, [filters]);

  // Function to get image URL with baseURL
  const getImageUrl = (url: string): string => {
    if (!url) return 'https://placehold.co/300x300?text=No+Image';

    // Already full URL (e.g., Cloudinary)
    if (url.startsWith('http')) return url;

    // Serve relative to backend (same server)
    const baseUrl = process.env.NODE_ENV === 'production'
      ? ''  // 👈 relative path
      : baseURL; // 👈 local backend

    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };

  const loadPreBuiltPCs = async () => {
    try {
      setLoading(true);
      const response = await preBuiltPCService.getPreBuiltPCs(filters, true);
      setPreBuiltPCs(response.data || []);
    } catch (error: any) {
      console.error('Error loading pre-built PCs:', error);
      
      if (error.response?.status === 404) {
        toast.error('Pre-built PCs admin endpoint not found. Please check backend routes.');
      } else {
        toast.error('Failed to load pre-built PCs');
      }
      
      setPreBuiltPCs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this pre-built PC?')) {
      try {
        await preBuiltPCService.deletePreBuiltPC(id);
        toast.success('Pre-built PC deleted successfully');
        loadPreBuiltPCs();
      } catch (error) {
        toast.error('Failed to delete pre-built PC');
        console.error('Error deleting pre-built PC:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await preBuiltPCService.deactivatePreBuiltPC(id);
        toast.success('Pre-built PC deactivated');
      }
      loadPreBuiltPCs();
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const categories = [...new Set(preBuiltPCs.map(pc => pc.category))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-built PCs</h1>
          <p className="text-gray-600">Manage your pre-built computer configurations</p>
        </div>
        <Link
          to="/admin/prebuilt-pcs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Pre-built PC</span>
        </Link>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>Debug:</strong> Loaded {preBuiltPCs.length} pre-built PCs
          {preBuiltPCs.length === 0 && ' - Make sure backend routes are properly configured.'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search PCs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 12 })}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Computer className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total PCs</p>
              <p className="text-2xl font-bold text-gray-900">{preBuiltPCs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {preBuiltPCs.filter(pc => pc.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-gray-900">
                {preBuiltPCs.filter(pc => pc.featured).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tested</p>
              <p className="text-2xl font-bold text-gray-900">
                {preBuiltPCs.filter(pc => pc.isTested).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PCs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PC Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                {/* ✅ ADD NEW PRICE FIELDS */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {preBuiltPCs.map((pc) => (
                <tr key={pc._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {pc.images && pc.images.length > 0 ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={getImageUrl(pc.images[0].url)}
                            alt={pc.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Computer className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {pc.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pc.components?.length || 0} components
                        </div>
                        {pc.isTested && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Tested
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {pc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${pc.discountPrice || pc.totalPrice}
                    </div>
                    {pc.discountPrice && pc.discountPrice !== pc.totalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        ${pc.totalPrice}
                      </div>
                    )}
                  </td>
                  
                  {/* ✅ ADD NEW PRICE FIELDS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${pc.basePrice || pc.totalPrice}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${pc.offerPrice || pc.discountPrice || pc.totalPrice}
                    </div>
                    {pc.offerPrice && pc.offerPrice < (pc.basePrice || pc.totalPrice) && (
                      <div className="text-xs text-green-600 font-medium">
                        Save ${((pc.basePrice || pc.totalPrice) - pc.offerPrice).toFixed(2)}
                      </div>
                    )}
                  </td>
                  
                  {/* ✅ ADD CONDITION FIELD */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pc.condition === 'New' 
                        ? 'bg-green-100 text-green-800'
                        : pc.condition === 'Refurbished'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pc.condition || 'New'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (pc.stockQuantity || 0) > 10 
                        ? 'bg-green-100 text-green-800'
                        : (pc.stockQuantity || 0) > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pc.stockQuantity || 0} in stock
                    </span>
                  </td>
                  
                  {/* ✅ ADD RATING FIELD */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-900">
                        {pc.averageRating || 0}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        ({pc.totalReviews || 0})
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(pc._id, pc.isActive || false)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          pc.isActive ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            pc.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">
                        {pc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/prebuilt-pcs/edit/${pc._id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit PC"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/prebuilt-pcs/benchmarks/${pc._id}`}
                        className="text-green-600 hover:text-green-900"
                        title="Manage Benchmarks"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(pc._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete PC"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {preBuiltPCs.length === 0 && (
          <div className="text-center py-12">
            <Computer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No pre-built PCs found</h3>
            <p className="text-gray-500 mt-2">
              {filters.search || filters.category || filters.status 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first pre-built PC'
              }
            </p>
            {(filters.search || filters.category || filters.status) ? (
              <button
                onClick={() => setFilters({ page: 1, limit: 12 })}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/admin/prebuilt-pcs/new"
                className="mt-4 inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pre-built PC
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreBuiltPCList;