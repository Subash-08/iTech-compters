import React, { useState, useEffect } from 'react';
import { CategoryFilters, Category } from '../types/category';
import categoryAPI from '../services/categoryAPI';
import { Icons } from '../Icon';

interface CategoryFiltersProps {
  filters: CategoryFilters;
  onFilterChange: (filters: Partial<CategoryFilters>) => void;
}

const CategoryFiltersComponent: React.FC<CategoryFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch parent categories for the parent filter
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await categoryAPI.getCategories({ limit: 100 });
        setParentCategories(response.categories || []);
      } catch (error) {
        console.error('Failed to fetch parent categories:', error);
      }
    };
    
    fetchParentCategories();
  }, []);

  const handleStatusChange = (status: string) => {
    onFilterChange({ status: status || undefined });
  };

  const handleKeywordChange = (keyword: string) => {
    onFilterChange({ keyword: keyword || undefined });
  };

  const handleParentChange = (parentCategory: string) => {
    onFilterChange({ parentCategory: parentCategory || undefined });
  };

  const handleLimitChange = (limit: number) => {
    onFilterChange({ limit });
  };

  const clearFilters = () => {
    onFilterChange({
      status: undefined,
      keyword: undefined,
      parentCategory: undefined,
      page: 1
    });
  };

  const hasActiveFilters = filters.status || filters.keyword || filters.parentCategory;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col gap-4">
        {/* Main Filters Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search categories by name or slug..."
                value={filters.keyword || ''}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {filters.keyword && (
                <button
                  onClick={() => handleKeywordChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <Icons.X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Basic Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filters.limit || 10}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <Icons.Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[filters.status, filters.keyword, filters.parentCategory].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <Icons.X className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Parent Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={filters.parentCategory || ''}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Parents</option>
                  <option value="null">No Parent (Root)</option>
                  {parentCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sort || ''}
                  onChange={(e) => onFilterChange({ sort: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name A-Z</option>
                  <option value="-name">Name Z-A</option>
                  <option value="createdAt">Newest First</option>
                  <option value="-createdAt">Oldest First</option>
                  <option value="updatedAt">Recently Updated</option>
                  <option value="-updatedAt">Least Recently Updated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleStatusChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.keyword && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Search: {filters.keyword}
                <button
                  onClick={() => handleKeywordChange('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.parentCategory && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Parent: {filters.parentCategory === 'null' ? 'No Parent' : parentCategories.find(p => p._id === filters.parentCategory)?.name || 'Loading...'}
                <button
                  onClick={() => handleParentChange('')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFiltersComponent;