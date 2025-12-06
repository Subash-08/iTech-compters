import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import api from '../config/axiosConfig';

// Types (keep your existing types)
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
  const [sliderValues, setSliderValues] = useState([0, 5000]);
  
  const { brandName, categoryName } = useParams();
  
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    brands: [],
    categories: [],
    conditions: ['New', 'Refurbished', 'Used'],
    maxPrice: 5000,
    minPrice: 0
  });

  // Move getFiltersFromURL inside the component and don't use hooks in it
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

  // Update slider values when filters change from URL
  useEffect(() => {
    const filters = getFiltersFromURL();
    setSliderValues([filters.minPrice, filters.maxPrice]);
  }, [searchParams, categoryName, brandName]);

  // Fetch products - FIXED: No hooks inside this function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = getFiltersFromURL();

      // Build query parameters
      const params: Record<string, any> = {
        page: currentPage,
        limit: 12,
        status: 'Published',
      };

      // Sort mapping
      const sortMap: Record<string, string> = {
        'featured': 'featured',
        'newest': 'newest', 
        'price-low': 'price-low',
        'price-high': 'price-high',
        'rating': 'rating'
      };
      params.sort = sortMap[sortBy] || 'featured';

      // Use route parameters as query filters
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
      if (filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice < 5000) params.maxPrice = filters.maxPrice;
      if (filters.rating > 0) params.rating = filters.rating;


      const response = await api.get<ProductsResponse>('/products', { params });
      
      const data = response.data;
    
      
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.totalProducts || 0);

      extractAvailableFilters(data.products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Extract available brands and categories from products
const extractAvailableFilters = (products: Product[]) => {
  const brands = new Set<string>();
  const categories = new Set<string>();
  let maxPrice = 0;

  products.forEach(product => {
    if (product.brand?.name) {
      brands.add(product.brand.name);
    }

    product.categories?.forEach(cat => {
      if (cat.name) {
        categories.add(cat.name);
      }
    });

    const price = product.offerPrice || product.basePrice;
    if (price > maxPrice) maxPrice = price;
  });

  setAvailableFilters(prev => ({
    ...prev,
    brands: Array.from(brands).sort(),
    categories: Array.from(categories).sort(),
    maxPrice: Math.ceil(maxPrice / 100) * 100 || 5000, // This should be max from electronics products
    minPrice: 0
  }));
};

  // Effect to fetch products
  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, searchParams, brandName, categoryName]);
  
  useEffect(() => {
  const fetchMaxPrice = async () => {
    try {
      const filters = getFiltersFromURL();
      
      const params: Record<string, any> = {
        limit: 1,
        sort: '-basePrice', // Alternative sort parameter
        status: 'Published',
      };

      // Apply filters
      if (brandName) params.brand = brandName;
      if (categoryName) params.category = categoryName;
      if (filters.brand && !brandName) params.brand = filters.brand;
      if (filters.category && !categoryName) params.category = filters.category;


      const response = await api.get('/products', { params });
      
      if (response.data.products.length > 0) {
        const maxProduct = response.data.products[0];
        const maxPrice = maxProduct.offerPrice || maxProduct.basePrice;
        
        setAvailableFilters(prev => ({
          ...prev,
          maxPrice: Math.ceil(maxPrice / 100) * 100,
        }));
      }
    } catch (err) {
      console.error('Error in fetchMaxPrice:', err);
    }
  };

  fetchMaxPrice();

}, [brandName, categoryName, searchParams.toString()]);

  // Update URL when filters change
  const updateFilter = (key: string, value: string | number | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    
    if ((key === 'brand' && brandName) || (key === 'category' && categoryName)) {
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

  // Clear all filters
  const clearFilters = () => {
    if (brandName || categoryName) {
      const newParams = new URLSearchParams();
      setSearchParams(newParams);
    } else {
      setSearchParams(new URLSearchParams());
    }
    setCurrentPage(1);
  };

  // Remove specific filter
  const removeFilter = (key: string) => {
    if ((key === 'brand' && brandName) || (key === 'category' && categoryName)) {
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  // Get available options based on current filters
  const getAvailableOptions = (type: 'brands' | 'categories') => {
    let availableOptions = availableFilters[type];
    
    const filters = getFiltersFromURL();
    
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

  // Get page title
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

  // Check if we should show specific filters
  const shouldShowFilter = (filterType: 'brand' | 'category') => {
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

  // Product card component
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const displayPrice = product.offerPrice || product.basePrice;
    const originalPrice = product.basePrice;
    const hasDiscount = displayPrice < originalPrice;
    const inStock = product.stockQuantity > 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        <Link to={`/product/${product.slug}`} className="block p-4 flex-1">
          <div className="relative mb-4">
            <img
              src={product.images?.thumbnail?.url || ''}
              alt={product.images?.thumbnail?.altText || product.name}
              className="w-full h-48 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '';
              }}
            />
            
            {hasDiscount && product.discountPercentage > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discountPercentage}% OFF
              </div>
            )}
            
            {!inStock && (
              <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
                <span className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="text-sm text-gray-500 uppercase tracking-wide">
              {product.brand?.name || 'No Brand'}
            </div>

            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[3rem]">
              {product.name}
            </h3>

            {product.averageRating > 0 && (
              <div className="flex items-center space-x-1">
                {renderStars(product.averageRating)}
                <span className="text-sm text-gray-500 ml-1">
                  ({product.averageRating.toFixed(1)})
                </span>
              </div>
            )}

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

            <div className="text-sm text-gray-600">
              Condition: {product.condition}
            </div>

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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-1">
            Showing {products.length} of {totalProducts} products
          </p>
          
          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

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
        {/* Filters Sidebar */}
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

            {/* Price Range Filter */}
{/* Price Range Filter */}
<div className="mb-6">
  <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
  <div className="space-y-4">
    {/* Slider */}
    <div className="px-2">
      <Slider
        range
        min={0} 
        max={availableFilters.maxPrice} 
        value={sliderValues}
        onChange={(value) => {
          if (Array.isArray(value)) {
            // Only update local slider values for smooth dragging
            setSliderValues(value);
          }
        }}
        onAfterChange={(value) => {
          if (Array.isArray(value)) {
            // Update URL and fetch products only when dragging is complete
            const newParams = new URLSearchParams(searchParams);
            newParams.set('minPrice', value[0].toString());
            newParams.set('maxPrice', value[1].toString());
            setSearchParams(newParams);
            setCurrentPage(1);
          }
        }}
        trackStyle={[{ backgroundColor: '#3b82f6', height: 6 }]}
        handleStyle={[
          {
            backgroundColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 2,
            height: 18,
            width: 18,
            opacity: 1,
          },
          {
            backgroundColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 2,
            height: 18,
            width: 18,
            opacity: 1,
          },
        ]}
        railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
        activeDotStyle={{ borderColor: '#3b82f6' }}
      />
    </div>

    {/* Price Display and Inputs */}
    <div className="flex items-center justify-between space-x-4">
      {/* Current Selected Range - Show live slider values during drag */}
      <div className="text-sm font-medium text-gray-700">
        ${sliderValues[0]} - ${sliderValues[1]}
      </div>

      {/* Input Fields for precise control */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">Min:</span>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => {
              const newMin = Number(e.target.value);
              if (newMin >= 0 && newMin <= filters.maxPrice) {
                updateFilter('minPrice', newMin);
              }
            }}
            min={0}
            max={filters.maxPrice}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">Max:</span>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => {
              const newMax = Number(e.target.value);
              if (newMax >= filters.minPrice && newMax <= availableFilters.maxPrice) {
                updateFilter('maxPrice', newMax);
              }
            }}
            min={filters.minPrice}
            max={availableFilters.maxPrice}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
    </div>

    {/* Available Range Info - Fixed range */}
    <div className="text-xs text-gray-500 text-center">
      Available: $0 - ${availableFilters.maxPrice}
    </div>

    {/* Quick Price Buttons */}
    <div className="flex flex-wrap gap-2 justify-center">
      {[100, 250, 500, 1000].map((price) => (
        <button
          key={price}
          onClick={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('minPrice', '0');
            newParams.set('maxPrice', price.toString());
            setSearchParams(newParams);
            setCurrentPage(1);
          }}
          className={`px-2 py-1 text-xs rounded border ${
            filters.maxPrice === price && filters.minPrice === 0
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`}
        >
          Under ${price}
        </button>
      ))}
      <button
        onClick={() => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set('minPrice', '0');
          newParams.set('maxPrice', availableFilters.maxPrice.toString());
          setSearchParams(newParams);
          setCurrentPage(1);
        }}
        className={`px-2 py-1 text-xs rounded border ${
          filters.maxPrice === availableFilters.maxPrice && filters.minPrice === 0
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
        }`}
      >
        All Prices
      </button>
    </div>
  </div>
</div>

            {/* Rest of your filters... */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
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