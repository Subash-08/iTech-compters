import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';

// Types
interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: {
    _id: string;
    name: string;
  };
  categories: Array<{
    _id: string;
    name: string;
  }>;
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  stockQuantity: number;
  images: {
    thumbnail: {
      url: string;
      altText: string;
    };
  };
  averageRating: number;
  totalReviews: number;
  condition: string;
  isActive: boolean;
}

interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AvailableFilters {
  brands: string[];
  categories: string[];
  conditions: string[];
  maxPrice: number;
  minPrice: number;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ADD: Get route parameters for brand/category pages
  const { brandName, categoryName } = useParams();
  
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    brands: [],
    categories: [],
    conditions: ['New', 'Refurbished', 'Used'],
    maxPrice: 5000,
    minPrice: 0
  });

  // Get filters from URL parameters - UPDATED
  const getFiltersFromURL = () => {
    return {
      category: searchParams.get('category') || categoryName || '',
      brand: searchParams.get('brand') || brandName || '',
      condition: searchParams.get('condition') || '',
      inStock: searchParams.get('inStock') === 'true',
      minPrice: Number(searchParams.get('minPrice')) || 0,
      maxPrice: Number(searchParams.get('maxPrice')) || 5000,
      rating: Number(searchParams.get('rating')) || 0,
      brandId: searchParams.get('brandId') || '',
    };
  };

  // Fetch products - COMPLETELY UPDATED
// Fetch products - FIXED SORTING TO MATCH BACKEND
const fetchProducts = async () => {
  try {
    setLoading(true);
    setError('');

    const filters = getFiltersFromURL();
    console.log('Current filters:', filters);
    console.log('Route params - brandName:', brandName, 'categoryName:', categoryName);

    // ALWAYS use generic products endpoint with query parameters
    let apiUrl = `${import.meta.env.VITE_API_URL || "https://itech-compters.onrender.com"}/api/v1/products`;
    let params: Record<string, string> = {
      page: currentPage.toString(),
      limit: '12',
    };

    // FIXED: Match backend APIFeatures sorting parameter names
    // Your backend APIFeatures.sort() method expects 'sort' parameter with these values:
    const sortMap: Record<string, string> = {
      'featured': 'featured',      // Backend default: '-createdAt -averageRating'
      'newest': 'newest',          // Backend: '-createdAt'
      'price-low': 'price-low',    // Backend: 'basePrice'
      'price-high': 'price-high',  // Backend: '-basePrice'
      'rating': 'rating'           // Backend: '-averageRating'
    };
    params.status = 'Published';
    // Set the sort parameter - backend only uses 'sort', not 'order'
    params.sort = sortMap[sortBy] || 'featured';

    // Use route parameters as query filters (INSTEAD of specific endpoints)
    if (brandName) {
      params.brand = brandName;
    } else if (categoryName) {
      params.category = categoryName;
    }

    // Add additional filters
    if (filters.brand && !brandName) {
      params.brand = filters.brand;
    }
    if (filters.category && !categoryName) {
      params.category = filters.category;
    }
    if (filters.condition) params.condition = filters.condition;
    if (filters.inStock) params.inStock = 'true';
    if (filters.minPrice > 0) params.minPrice = filters.minPrice.toString();
    if (filters.maxPrice < 5000) params.maxPrice = filters.maxPrice.toString();
    if (filters.rating > 0) params.rating = filters.rating.toString();

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${apiUrl}${queryString ? `?${queryString}` : ''}`;
    
    console.log('API URL with sorting:', fullUrl);
    console.log('Sort parameters - frontend:', sortBy, 'backend sort param:', params.sort);

    const res = await fetch(fullUrl);
      
    console.log('Response status:', res.status);
      
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
    }
      
    const data: ProductsResponse = await res.json();
    console.log('Received data:', data);
      
    setProducts(data.products || []);
    setTotalPages(data.totalPages || 1);
    setTotalProducts(data.totalProducts || 0);

    // Extract available filters from the products
    extractAvailableFilters(data.products);
  } catch (err) {
    console.error('Error fetching products:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch products');
  } finally {
    setLoading(false);
  }
};

  // Extract available brands and categories from products
  const extractAvailableFilters = (products: Product[]) => {
    const brands = new Set<string>();
    const categories = new Set<string>();
    let maxPrice = 0;
    let minPrice = Infinity;

    products.forEach(product => {
      // Extract brands
      if (product.brand?.name) {
        brands.add(product.brand.name);
      }

      // Extract categories
      product.categories?.forEach(cat => {
        if (cat.name) {
          categories.add(cat.name);
        }
      });

      // Find price range
      const price = product.offerPrice || product.basePrice;
      if (price > maxPrice) maxPrice = price;
      if (price < minPrice) minPrice = price;
    });

    setAvailableFilters(prev => ({
      ...prev,
      brands: Array.from(brands).sort(),
      categories: Array.from(categories).sort(),
      maxPrice: Math.ceil(maxPrice / 100) * 100 || 5000,
      minPrice: Math.floor(minPrice / 100) * 100 || 0
    }));
  };

  // UPDATE: Add route parameters to useEffect dependencies
  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, searchParams, brandName, categoryName]);

  // Update URL when filters change - UPDATED
  const updateFilter = (key: string, value: string | number | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    
    // If we're on a brand/category page and trying to change the main filter,
    // we should navigate to the generic products page instead
    if ((key === 'brand' && brandName) || (key === 'category' && categoryName)) {
      // Navigate to generic products page with the new filter
      const genericParams = new URLSearchParams();
      genericParams.set(key, value.toString());
      window.location.href = `/products?${genericParams.toString()}`;
      return;
    }
    
    if (value && value !== '' && value !== 0 && value !== false) {
      newParams.set(key, value.toString());
    } else {
      newParams.delete(key);
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  // Clear all filters - UPDATED
  const clearFilters = () => {
    // If we're on a brand/category page, clear only additional filters
    if (brandName || categoryName) {
      const newParams = new URLSearchParams();
      setSearchParams(newParams);
    } else {
      // On generic products page, clear everything
      setSearchParams(new URLSearchParams());
    }
    setCurrentPage(1);
  };

  // Remove specific filter - UPDATED
  const removeFilter = (key: string) => {
    // Don't allow removing the main route filter
    if ((key === 'brand' && brandName) || (key === 'category' && categoryName)) {
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  // Get available options based on current filters - UPDATED
  const getAvailableOptions = (type: 'brands' | 'categories') => {
    let availableOptions = availableFilters[type];
    
    const filters = getFiltersFromURL();
    
    // If we have a brand filter (from route or query), show only categories that exist with that brand
    if (type === 'categories' && (filters.brand || brandName)) {
      const currentBrand = brandName || filters.brand;
      const brandCategories = new Set<string>();
      products.forEach(product => {
        if (product.brand?.name === currentBrand) {
          product.categories?.forEach(cat => {
            if (cat.name) brandCategories.add(cat.name);
          });
        }
      });
      availableOptions = Array.from(brandCategories).sort();
    }
    
    // If we have a category filter (from route or query), show only brands that exist in that category
    if (type === 'brands' && (filters.category || categoryName)) {
      const currentCategory = categoryName || filters.category;
      const categoryBrands = new Set<string>();
      products.forEach(product => {
        if (product.categories?.some(cat => cat.name === currentCategory)) {
          if (product.brand?.name) categoryBrands.add(product.brand.name);
        }
      });
      availableOptions = Array.from(categoryBrands).sort();
    }
    
    return availableOptions;
  };

  // Get page title - NEW FUNCTION
  const getPageTitle = () => {
    const filters = getFiltersFromURL();
    
    if (brandName) {
      return `${brandName.replace(/-/g, ' ')} Products`;
    } else if (categoryName) {
      return `${categoryName.replace(/-/g, ' ')} Products`;
    } else if (filters.category) {
      return `${filters.category} Products`;
    } else if (filters.brand) {
      return `${filters.brand} Products`;
    } else {
      return 'All Products';
    }
  };

  // Check if we should show specific filters - NEW FUNCTION
  const shouldShowFilter = (filterType: 'brand' | 'category') => {
    // Don't show brand filter on brand pages, don't show category filter on category pages
    if (filterType === 'brand' && brandName) return false;
    if (filterType === 'category' && categoryName) return false;
    return true;
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Product card component (unchanged)
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const displayPrice = product.offerPrice || product.basePrice;
    const originalPrice = product.basePrice;
    const hasDiscount = displayPrice < originalPrice;
    const inStock = product.stockQuantity > 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <Link to={`/product/${product.slug}`} className="block p-4 flex-1">
          {/* Product Image */}
          <div className="relative mb-4">
            <img
              src={product.images?.thumbnail?.url || 'https://via.placeholder.com/300x300?text=Product+1'}
              alt={product.images?.thumbnail?.altText || product.name}
              className="w-full h-48 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Product+1';
              }}
            />
            
            {/* Discount Badge */}
            {hasDiscount && product.discountPercentage > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discountPercentage}% OFF
              </div>
            )}
            
            {/* Out of Stock Overlay */}
            {!inStock && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
                <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2 flex-1">
            {/* Brand */}
            <div className="text-sm text-gray-500 uppercase tracking-wide">
              {product.brand?.name || 'No Brand'}
            </div>

            {/* Product Name */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[3rem]">
              {product.name}
            </h3>

            {/* Rating */}
            {product.averageRating > 0 && (
              <div className="flex items-center space-x-1">
                {renderStars(product.averageRating)}
                <span className="text-sm text-gray-500 ml-1">
                  ({product.averageRating.toFixed(1)})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">
                ${displayPrice}
              </span>
              {hasDiscount && originalPrice > displayPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${originalPrice}
                </span>
              )}
            </div>

            {/* Condition */}
            <div className="text-sm text-gray-600">
              Condition: {product.condition}
            </div>

            {/* Stock Status */}
            <div className={`text-sm font-medium ${
              inStock ? 'text-green-600' : 'text-red-600'
            }`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const filters = getFiltersFromURL();
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 0 && value !== false
  ) || brandName || categoryName;

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            This might be due to server issues or incompatible filter parameters.
          </p>
          <div className="space-x-4">
            <button 
              onClick={fetchProducts}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
            <button 
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Clear Filters
            </button>
            <Link 
              to="/"
              className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header - UPDATED */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-1">
            Showing {products.length} of {totalProducts} products
          </p>
          
          {/* Active filters display - UPDATED */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Show route-based filters as non-removable badges */}
              {brandName && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center">
                  Brand: {brandName.replace(/-/g, ' ')}
                </span>
              )}
              {categoryName && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                  Category: {categoryName.replace(/-/g, ' ')}
                </span>
              )}
              
              {/* Show query parameter filters as removable */}
              {filters.category && !categoryName && (
                <button
                  onClick={() => removeFilter('category')}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center hover:bg-blue-200"
                >
                  Category: {filters.category}
                  <span className="ml-1">×</span>
                </button>
              )}
              {filters.brand && !brandName && (
                <button
                  onClick={() => removeFilter('brand')}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center hover:bg-green-200"
                >
                  Brand: {filters.brand}
                  <span className="ml-1">×</span>
                </button>
              )}
              {filters.condition && (
                <button
                  onClick={() => removeFilter('condition')}
                  className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center hover:bg-purple-200"
                >
                  Condition: {filters.condition}
                  <span className="ml-1">×</span>
                </button>
              )}
              {filters.inStock && (
                <button
                  onClick={() => removeFilter('inStock')}
                  className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded flex items-center hover:bg-orange-200"
                >
                  In Stock Only
                  <span className="ml-1">×</span>
                </button>
              )}
              {filters.rating > 0 && (
                <button
                  onClick={() => removeFilter('rating')}
                  className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center hover:bg-yellow-200"
                >
                  {filters.rating}+ Stars
                  <span className="ml-1">×</span>
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-200"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Sort Controls */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - UPDATED */}
        <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter - CONDITIONAL */}
            {shouldShowFilter('category') && getAvailableOptions('categories').length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Category</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getAvailableOptions('categories').map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === category}
                        onChange={() => updateFilter('category', category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 truncate">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Filter - CONDITIONAL */}
            {shouldShowFilter('brand') && getAvailableOptions('brands').length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Brand</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getAvailableOptions('brands').map(brand => (
                    <label key={brand} className="flex items-center">
                      <input
                        type="radio"
                        name="brand"
                        checked={filters.brand === brand}
                        onChange={() => updateFilter('brand', brand)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 truncate">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Range: ${availableFilters.minPrice} - ${availableFilters.maxPrice}
                </div>
              </div>
            </div>

            {/* In Stock Filter */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Customer Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map(rating => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating}
                      onChange={() => updateFilter('rating', rating)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {rating}+ Stars
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Condition</h3>
              <div className="space-y-2">
                {availableFilters.conditions.map(condition => (
                  <label key={condition} className="flex items-center">
                    <input
                      type="radio"
                      name="condition"
                      checked={filters.condition === condition}
                      onChange={() => updateFilter('condition', condition)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">😔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ProductList;