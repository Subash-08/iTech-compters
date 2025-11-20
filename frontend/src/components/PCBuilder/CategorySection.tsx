import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import ComponentCard from './ComponentCard';
import { pcBuilderService } from './services/pcBuilderService';
import { Category, Product, SelectedComponents, Filters } from './types/pcBuilder';

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Category Header - Simple like screenshot */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600">{products.length} products</span>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-600">Quick Filter</span>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Q"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-20 pl-8 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-sm text-gray-600">Filtering</span>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="py-1 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="popular">Most popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-3">
        {products.map((product: Product) => (
          <div
            key={product._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  data-src={product.image || '/api/placeholder/96/96'}
                  alt={product.name}
                  className="w-full h-full object-contain rounded lazy-image"
                  loading="lazy"
                />
              </div>
              
              {/* Product Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {product.name}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {product.specifications?.[0]?.value || 'ATX'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {product.specifications?.[1]?.value || 'Windowed Side Panel'}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {product.brand}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-gray-500 line-through text-sm">
                          R {product.originalPrice?.toLocaleString()}
                        </span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                          Save R {(product.originalPrice - product.price).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      R {product.price?.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      In stock with Woolware
                    </div>
                    <div className="text-xs text-gray-500">
                      1 - 2 business days
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Select Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => onComponentSelect(category.slug, product)}
                  className={`px-6 py-2 rounded font-medium text-sm transition-colors ${
                    selectedProduct?._id === product._id
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedProduct?._id === product._id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-4" />}

      {/* No Products */}
      {products.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No products found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
};

export default React.memo(CategorySection);