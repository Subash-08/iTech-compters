import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Check, X } from 'lucide-react'; // Added icons for buttons
import { pcBuilderService } from './services/pcBuilderService';
import { Category, Product, SelectedComponents, Filters } from './types/pcBuilder';
import { getImageUrl } from '../utils/imageUtils'; // Ensure this path matches your file structure

interface CategorySectionProps {
  category: Category;
  selectedComponents: SelectedComponents;
  onComponentSelect: (categorySlug: string, product: Product | null) => void;
  isRequired?: boolean;
  isVisible?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  category, 
  selectedComponents, 
  onComponentSelect,
  isRequired = false,
  isVisible = true
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    sort: 'popular',
    minPrice: '',
    maxPrice: '',
    inStock: '',
    condition: ''
  });
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const loadingRef = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const selectedProduct: Product | null = selectedComponents[category.slug];

  // Load products only when visible and filters change
  useEffect(() => {
    if (isVisible) {
      loadProducts(false);
    }
  }, [filters, isVisible]);

  // Infinite scroll setup
  useEffect(() => {
    if (!isVisible) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isVisible, hasMore]);

  // Load more products when page changes
  useEffect(() => {
    if (page > 1 && isVisible) {
      loadProducts(true);
    }
  }, [page]);

  const loadProducts = useCallback(async (append: boolean = false): Promise<void> => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const response = await pcBuilderService.getComponentsByCategory(category.slug, {
        ...filters,
        page: append ? page : 1,
        limit: 12
      });
      
      if (append) {
        setProducts(prev => [...prev, ...response.products]);
      } else {
        setProducts(response.products);
        setPage(1);
      }
      
      setHasMore(response.pagination.page < response.pagination.pages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [category.slug, filters, page]);

  const handleFilterChange = useCallback((key: keyof Filters, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isVisible) {
        loadProducts(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Toggle Selection Logic
  const handleToggleSelect = (product: Product) => {
    if (selectedProduct?._id === product._id) {
      // If currently selected, remove it
      onComponentSelect(category.slug, null);
    } else {
      // Select new product
      onComponentSelect(category.slug, product);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      {/* Category Header */}
      <div className="mb-4 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-3">
          <span className="text-sm text-gray-600">{products.length} products found</span>
          
          <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full sm:w-40 pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="py-1.5 px-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="popular">Popular</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
              <option value="rating">Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {products.map((product: Product) => {
          const isSelected = selectedProduct?._id === product._id;

          return (
            <div
              key={product._id}
              onClick={() => handleToggleSelect(product)}
              className={`border rounded-lg p-4 transition-all cursor-pointer group ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
              }`}
            >
              <div className="flex gap-4 items-start sm:items-center">
                
                {/* Product Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white rounded-md p-1 border border-gray-100">
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/100x100?text=No+Image";
                    }}
                  />
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate pr-2">
                    {product.name}
                  </h3>
                  
                  {/* Specifications / Brand */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {product.brand && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                        {product.brand}
                      </span>
                    )}
                    {/* Example Specs - Replace keys with your actual spec keys */}
                    {product.specifications?.slice(0, 2).map((spec: any, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                        {spec.value}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stock Status */}
                    <div className={`text-xs font-medium flex items-center gap-1 ${
                      product.inStock ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                    
                    {/* Delivery Estimate (Static/Mock for now) */}
                    {product.inStock && (
                      <span className="text-xs text-gray-400 hidden sm:inline-block">
                        • 2-3 Days Delivery
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Select/Remove Button */}
                <div className="flex-shrink-0 self-center pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(product);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm ${
                      isSelected
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        : 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <X size={16} />
                        <span className="hidden sm:inline">Remove</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span className="hidden sm:inline">Select</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-4 w-full" />}

      {/* No Products Found */}
      {products.length === 0 && !loading && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-2">
          <p className="text-gray-500 text-sm">No components found matching your search.</p>
          <button 
            onClick={() => handleFilterChange('search', '')}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(CategorySection);