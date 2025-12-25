// sections/LinkedProductsSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ProductFormData, Product } from '../types/product';
import api from '../../config/axiosConfig';
import { toast } from 'react-toastify';

interface LinkedProductsSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditMode: boolean;
  currentProductId?: string;
}

interface ProductSearchFilters {
  search: string;
  category: string;
  brand: string;
  status: string;
  inStock: string;
  sort: string;
  page: number;
  limit: number;
}

const LinkedProductsSection: React.FC<LinkedProductsSectionProps> = ({
  formData,
  updateFormData,
  isEditMode,
  currentProductId
}) => {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductSearchFilters>({
    search: '',
    category: '',
    brand: '',
    status: '',
    inStock: '',
    sort: 'name-asc',
    page: 1,
    limit: 20,
  });
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(false);

  // Fetch available products with filters
  const fetchAvailableProducts = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Always exclude current product in edit mode
      if (isEditMode && currentProductId) {
        queryParams.append('excludeId', currentProductId);
      }
      const response = await api.get(`/admin/products?${queryParams}`);
      const productsData = response.data;
      let products: Product[] = [];
      if (productsData.success) {
        products = productsData.products || productsData.data || [];
        setHasMore(productsData.currentPage < productsData.totalPages);
      } else if (Array.isArray(productsData)) {
        products = productsData;
      } else {
        products = productsData.products || productsData.data || [];
      }

      if (reset) {
        setAvailableProducts(products);
      } else {
        setAvailableProducts(prev => [...prev, ...products]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load products';
      toast.error(errorMessage);
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isEditMode, currentProductId]);

  // Load selected products details
  const loadSelectedProducts = useCallback(async () => {
    if (!formData.linkedProducts || formData.linkedProducts.length === 0) {
      setSelectedProducts([]);
      return;
    }

    try {
      const productDetails = await Promise.all(
        formData.linkedProducts.map(async (productId) => {
          try {
            const response = await api.get(`/admin/product/${productId}`);
            
            // Handle different response structures
            return response.data.product || response.data;
          } catch (error: any) {
            console.error(`Error fetching product ${productId}:`, error);
            // If product not found, remove it from linked products
            if (error.response?.status === 404) {
              toast.warning(`Product ${productId} not found, removing from linked products`);
              removeProduct(productId);
            }
            return null;
          }
        })
      );

      const validProducts = productDetails.filter(Boolean) as Product[];
      setSelectedProducts(validProducts);
      
      // 🆕 Sync with form data in case some products were not found
      const validProductIds = validProducts.map(p => p._id!);
      if (validProductIds.length !== formData.linkedProducts.length) {
        updateFormData({ linkedProducts: validProductIds });
      }
    } catch (error) {
      console.error('Error loading selected products:', error);
      toast.error('Failed to load selected products');
    }
  }, [formData.linkedProducts]);

  // Initialize
  useEffect(() => {
    fetchAvailableProducts(true);
    loadSelectedProducts();
  }, [fetchAvailableProducts, loadSelectedProducts]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchTerm,
        page: 1
      }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch products when filters change
  useEffect(() => {
    if (filters.page === 1) {
      fetchAvailableProducts(true);
    } else {
      fetchAvailableProducts(false);
    }
  }, [filters.search, filters.category, filters.brand, filters.status, filters.inStock, filters.sort, filters.page]);

  // Add product to linked products
  const addProduct = (product: Product) => {
    if (!product._id) {
      toast.error('Invalid product');
      return;
    }

    // Check if product is already added
    const isAlreadyAdded = formData.linkedProducts.includes(product._id);
    if (isAlreadyAdded) {
      toast.warning('Product is already linked');
      return;
    }

    // Check if trying to add current product
    if (isEditMode && product._id === currentProductId) {
      toast.warning('Cannot link product to itself');
      return;
    }

    const updatedLinkedProducts = [...formData.linkedProducts, product._id];
    updateFormData({ linkedProducts: updatedLinkedProducts });
    setSelectedProducts(prev => [...prev, product]);
    toast.success('Product linked successfully');
  };

  // Remove product from linked products
  const removeProduct = (productId: string) => {
    const updatedLinkedProducts = formData.linkedProducts.filter(id => id !== productId);
    updateFormData({ linkedProducts: updatedLinkedProducts });
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
    toast.info('Product unlinked');
  };

  // Handle filter change
  const handleFilterChange = (key: keyof ProductSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      category: '',
      brand: '',
      status: '',
      inStock: '',
      sort: 'name-asc',
      page: 1,
      limit: 20,
    });
  };

  // Load more products
  const loadMore = () => {
    if (!loading && hasMore) {
      setFilters(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  };

  const hasActiveFilters = filters.search || filters.category || filters.brand || filters.status || filters.inStock;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Linked Products</h2>
        <p className="text-sm text-gray-600">
          Link related products that customers might be interested in. {isEditMode && 'Current product is automatically excluded.'}
        </p>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Debug:</strong> Current Linked Products: {formData.linkedProducts?.length || 0}
            <br />
            Selected Products: {selectedProducts.length}
            <br />
            Current Product ID: {currentProductId}
          </p>
        </div>
      )}

      {/* Selected Linked Products */}
      {selectedProducts.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Linked Products ({selectedProducts.length})</h3>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center space-x-3">
                  {product.images?.thumbnail?.url && (
                    <img
                      src={product.images.thumbnail.url}
                      alt={product.images.thumbnail.altText || product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      <p className="text-xs text-gray-500">Price: ${product.basePrice}</p>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        product.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(product._id!)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap ml-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Add Products */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Add Linked Products</h3>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, SKU, or description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Stock
            </label>
            <select
              value={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stock</option>
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low to High</option>
              <option value="price-desc">Price High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Products List */}
        <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
          {loading && filters.page === 1 ? (
            <div className="p-4 text-center">
              <div className="animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border-b border-gray-100">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : availableProducts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {availableProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {product.images?.thumbnail?.url && (
                      <img
                        src={product.images.thumbnail.url}
                        alt={product.images.thumbnail.altText || product.name}
                        className="w-10 h-10 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 flex-wrap">
                        <span>SKU: {product.sku}</span>
                        <span>•</span>
                        <span>${product.basePrice}</span>
                        <span>•</span>
                        <span className={`px-1 rounded ${
                          product.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    disabled={formData.linkedProducts.includes(product._id!)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-2 flex-shrink-0"
                  >
                    {formData.linkedProducts.includes(product._id!) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No products found matching your criteria.
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {selectedProducts.length === 0 && !loading && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No linked products yet.</p>
          <p className="text-gray-400 text-xs mt-1">Add related products to help customers discover more items.</p>
        </div>
      )}
    </div>
  );
};

export default LinkedProductsSection;