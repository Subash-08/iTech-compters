// components/Search/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { productActions } from '../../redux/actions/productActions';
import SearchIcon from '../icons/SearchIcon';
import XIcon from '../icons/XIcon';
import {
  selectSearchResults,
  selectSearchLoading,
  selectSearchQuery,
} from '../../redux/selectors/productSelector';
import { clearSearchResults, updateSearchQuery } from '../../redux/slices/productSlice';
import { getImageUrl } from '../utils/imageUtils';

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get search state from Redux
  const searchResults = useAppSelector(selectSearchResults);
  const searchLoading = useAppSelector(selectSearchLoading);
  const currentSearchQuery = useAppSelector(selectSearchQuery);

  // Initialize with current search query from Redux
  useEffect(() => {
    if (currentSearchQuery) {
      setSearchTerm(currentSearchQuery);
    }
  }, [currentSearchQuery]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 2) {
        dispatch(productActions.quickSearch(searchTerm.trim()));
        setShowSuggestions(true);
      } else if (searchTerm.trim().length === 0) {
        dispatch(clearSearchResults());
        setShowSuggestions(false);
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Update Redux state
      dispatch(updateSearchQuery(searchTerm.trim()));
      
      // Navigate to products page with search
      // --- CHANGE 1: Updated path from /product to /products ---
      navigate({
        pathname: '/products', 
        search: `?${createSearchParams({ search: searchTerm.trim() })}`
      });
      
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (product: any) => {
    // Note: Assuming detail page remains /product/slug. 
    // If detail pages should also be /products/slug, change this line too.
    navigate(`/product/${product.slug}`);
    setShowSuggestions(false);
    setSearchTerm('');
    dispatch(clearSearchResults());
  };

  const handleClear = () => {
    setSearchTerm('');
    dispatch(clearSearchResults());
    dispatch(updateSearchQuery(''));
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleViewAllResults = () => {
    if (searchTerm.trim()) {
      dispatch(updateSearchQuery(searchTerm.trim()));
      // --- CHANGE 2: Updated path from /product to /products ---
      navigate({
        pathname: '/products',
        search: `?${createSearchParams({ search: searchTerm.trim() })}`
      });
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for components, PCs, and more..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (searchTerm.trim().length > 2 && searchResults.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          // --- CHANGE 3: CSS Updated ---
          // Removed pl-12 (left padding), added pl-4
          // Increased pr-10 to pr-24 (right padding) to accommodate both buttons
          className="pl-4 pr-24 py-2.5 w-full border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
          aria-label="Search products"
        />
        
        {/* --- CHANGE 4: Clear Button Position Update --- */}
        {/* Moved to right-14 to sit next to the search button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}

        {/* --- CHANGE 5: Search Icon moved to Right & Made Clickable --- */}
        {/* Changed from div/icon to button[type=submit]. Positioned absolute right. */}
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-1"
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5" />
        </button>

      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && isFocused && searchTerm.trim().length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {searchLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="p-2">
                {searchResults.slice(0, 5).map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors flex items-center space-x-3"
                  >
                    <img
                      src={getImageUrl(product.images?.thumbnail || product.images?.[0])}
                      alt={product.name}
                      className="w-10 h-10 object-contain rounded border bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=No+Img";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{product.offerPrice || product.basePrice}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleViewAllResults}
                  className="w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                >
                  View all {searchResults.length} results for "{searchTerm}"
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No products found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;