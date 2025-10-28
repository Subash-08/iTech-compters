import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, CategoryFilters } from '../types/category';
import categoryAPI from '../services/categoryAPI'; // Updated import
import { Icons } from '../Icon';
import CategoryTable from './CategoryTable';
import CategoryFiltersComponent from './CategoryFiltersComponent';
import StatusBadge from '../common/StatusBadge';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

const CategoryList: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<CategoryFilters>({
    page: 1,
    limit: 10,
    status: '',
    keyword: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  // Fetch categories
// In your CategoryList component, update the fetchCategories function:
const fetchCategories = async () => {
  try {
    setLoading(true);
    setError('');
    

    // Use admin endpoint to see all categories (active + inactive)
    const response = await categoryAPI.getCategories(filters, true); // true = isAdmin
    

    setCategories(response.categories || []);
    setPagination({
      total: response.totalCount || response.count || 0,
      pages: response.pages || 1,
      currentPage: response.currentPage || 1
    });
    
  } catch (err: any) {
    console.error('💥 Error fetching categories:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch categories';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchCategories();
  }, [filters]);

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedCategories.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        if (!window.confirm(`Are you sure you want to deactivate ${selectedCategories.length} categories?`)) {
          return;
        }
        
        await Promise.all(
          selectedCategories.map(id => 
            categoryAPI.updateStatus(id, { status: 'inactive', reason: 'bulk_action' })
          )
        );
      } else if (bulkAction === 'activate') {
        await Promise.all(
          selectedCategories.map(id => 
            categoryAPI.updateStatus(id, { status: 'active' })
          )
        );
      }

      setSelectedCategories([]);
      setBulkAction('');
      fetchCategories(); // Refresh data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Bulk action failed';
      setError(errorMessage);
    }
  };

  // Handle category status toggle
  const handleStatusToggle = async (categoryId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const reason = newStatus === 'inactive' ? 'manual_deactivation' : undefined;
      
      await categoryAPI.updateStatus(categoryId, { 
        status: newStatus as 'active' | 'inactive', 
        reason 
      });
      fetchCategories(); // Refresh data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update category status';
      setError(errorMessage);
    }
  };

  // Handle category deletion
  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${categoryName}"? This will make it unavailable on the store.`)) {
      return;
    }

    try {
      await categoryAPI.updateStatus(categoryId, { 
        status: 'inactive', 
        reason: 'manual_deactivation' 
      });
      fetchCategories(); // Refresh data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to deactivate category';
      setError(errorMessage);
    }
  };

  // Handle filters change
  const handleFilterChange = (newFilters: Partial<CategoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Clear error
  const clearError = () => setError('');

  if (loading && categories.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage your product categories and organization
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/categories/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icons.AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors duration-200"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <CategoryFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Categories Table */}
      {categories.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <CategoryTable
              categories={categories}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
              onEdit={(id) => navigate(`/admin/categories/edit/${id}`)}
            />
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No categories found"
          description={filters.keyword || filters.status ? 
            "Try adjusting your search filters to find what you're looking for." : 
            "Get started by creating your first category."
          }
          action={{
            label: 'Add Category',
            onClick: () => navigate('/admin/categories/new')
          }}
        />
      )}

      {/* Loading overlay for subsequent loads */}
      {loading && categories.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default CategoryList;