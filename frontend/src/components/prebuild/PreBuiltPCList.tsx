// components/prebuilt/PreBuiltPCList.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { preBuiltPCActions } from '../../redux/actions/preBuiltPCActions';
import {
  selectPreBuiltPCs,
  selectLoading,
  selectError,
  selectFilters,
  selectAvailableFilters,
  selectTotalPages,
  selectCurrentPage,
  selectTotalProducts
} from '../../redux/selectors/preBuiltPCSelectors';
import PreBuiltPCCard from './PreBuiltPCCard';
import PreBuiltPCFilters from './PreBuiltPCFilters';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import { PreBuiltPCFilters as FiltersType } from '../../redux/types/preBuiltPCTypes';

const PreBuiltPCList: React.FC = () => {
  const dispatch = useAppDispatch();
  const preBuiltPCs = useAppSelector(selectPreBuiltPCs);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const filters = useAppSelector(selectFilters);
  const availableFilters = useAppSelector(selectAvailableFilters);
  const totalPages = useAppSelector(selectTotalPages);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalProducts = useAppSelector(selectTotalProducts);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(preBuiltPCActions.fetchPreBuiltPCs(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters: Partial<FiltersType>) => {
    dispatch(preBuiltPCActions.updateFilters({ ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(preBuiltPCActions.setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sortBy: string) => {
    dispatch(preBuiltPCActions.setSortBy(sortBy));
  };

  const clearAllFilters = () => {
    dispatch(preBuiltPCActions.clearFilters());
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
          <p>Error loading pre-built PCs: {error}</p>
          <button
            onClick={() => dispatch(preBuiltPCActions.clearError())}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pre-built Gaming PCs
        </h1>
        <p className="text-gray-600">
          Discover our carefully curated collection of high-performance pre-built computers
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {totalProducts} PCs found
          </div>
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <select
              value={filters.sortBy || 'featured'}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="performance">Best Performance</option>
              <option value="gaming">Best for Gaming</option>
              <option value="productivity">Best for Productivity</option>
            </select>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <PreBuiltPCFilters
            filters={filters}
            availableFilters={availableFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearAllFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="large" />
            </div>
          ) : preBuiltPCs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">🖥️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No PCs Found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* PC Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {preBuiltPCs.map((pc) => (
                  <PreBuiltPCCard key={pc._id} pc={pc} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCList;