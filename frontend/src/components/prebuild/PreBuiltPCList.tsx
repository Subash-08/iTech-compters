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
import { SlidersHorizontal, ChevronDown, MonitorPlay } from 'lucide-react'; // Added icons for better UI

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
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center bg-red-50 p-8 rounded-xl max-w-md w-full border border-red-100">
          <p className="text-red-600 font-medium mb-4">Unable to load products</p>
          <p className="text-sm text-red-500 mb-6">{error}</p>
          <button
            onClick={() => dispatch(preBuiltPCActions.clearError())}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              Pre-built Gaming PCs
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl">
              High-performance rigs, professionally assembled and tested.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filters.sortBy || 'featured'}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full sm:w-48 appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="performance">Performance</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">
          
          {/* Filters Sidebar - Sticky on Desktop */}
          <aside className={`
            lg:w-72 flex-shrink-0 
            ${showFilters ? 'block' : 'hidden lg:block'}
           
          `}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between lg:hidden mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-gray-500">Close</button>
              </div>
              
              <PreBuiltPCFilters
                filters={filters}
                availableFilters={availableFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearAllFilters}
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 w-full">
            
            {/* Results Count Bar */}
            {!loading && (
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Showing <span className="text-gray-900 font-bold">{preBuiltPCs.length}</span> of <span className="text-gray-900 font-bold">{totalProducts}</span> systems
                </span>
              </div>
            )}

            {loading ? (
              <div className="min-h-[400px] flex justify-center items-center">
                <LoadingSpinner size="large" />
              </div>
            ) : preBuiltPCs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MonitorPlay className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No PCs Found</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  We couldn't find any pre-built PCs matching your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* PC Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-12">
                  {preBuiltPCs.map((pc) => (
                    <PreBuiltPCCard key={pc._id} pc={pc} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-2 border-t border-gray-200 pt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCList;