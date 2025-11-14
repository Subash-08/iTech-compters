// src/components/admin/showcase/ProductSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Plus, 
  Filter, 
  SortAsc, 
  Grid3X3, 
  List, 
  ChevronDown,
  Eye,
  Package,
  Tag,
  Star
} from 'lucide-react';
import { Product, Brand, Category } from '../types/product';
import api from '../../config/axiosConfig';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onProductSelect: (products: Product[]) => void;
  existingProducts?: string[];
}

interface FilterState {
  category: string;
  brand: string;
  stockStatus: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  onProductSelect,
  existingProducts = []
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedProducts.map(p => p._id))
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    brand: '',
    stockStatus: 'all',
    priceRange: { min: 0, max: 100000 },
    rating: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchBrandsAndCategories();
    }
  }, [isOpen, searchTerm, filters, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        search: searchTerm || undefined,
        limit: 100, // Increased limit for better selection
        sort: sortBy,
        inStock: filters.stockStatus === 'inStock' ? 'true' : 
                filters.stockStatus === 'outOfStock' ? 'false' : undefined,
        category: filters.category || undefined,
        brand: filters.brand || undefined
      };

      const response = await api.get('/admin/products', { params });
      
      // Handle different response structures
      const productsData = response.data.products || response.data.data || [];
      
      // Apply additional filters
      let filteredProducts = productsData;
      
      // Price range filter
      if (filters.priceRange.min > 0 || filters.priceRange.max < 100000) {
        filteredProducts = filteredProducts.filter((product: Product) => {
          const price = product.offerPrice || product.basePrice;
          return price >= filters.priceRange.min && price <= filters.priceRange.max;
        });
      }
      
      // Rating filter
      if (filters.rating > 0) {
        filteredProducts = filteredProducts.filter((product: Product) => 
          product.averageRating >= filters.rating
        );
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        api.get('/brands'),
        api.get('/categories')
      ]);

      const brandsData = brandsResponse.data.brands || brandsResponse.data.data || [];
      const categoriesData = categoriesResponse.data.categories || categoriesResponse.data.data || [];

      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching brands and categories:', error);
    }
  };

  const toggleProductSelection = (product: Product) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(product._id)) {
      newSelectedIds.delete(product._id);
    } else {
      newSelectedIds.add(product._id);
    }
    setSelectedIds(newSelectedIds);
  };

  const selectAllVisible = () => {
    const newSelectedIds = new Set(selectedIds);
    products.forEach(product => {
      newSelectedIds.add(product._id);
    });
    setSelectedIds(newSelectedIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    const selectedProductsList = products.filter(product => 
      selectedIds.has(product._id)
    );
    onProductSelect(selectedProductsList);
    onClose();
  };

  const isProductSelected = (productId: string) => selectedIds.has(productId);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      stockStatus: 'all',
      priceRange: { min: 0, max: 100000 },
      rating: 0
    });
    setSearchTerm('');
  };

  const getProductStatus = (product: Product) => {
    if (product.stockQuantity <= 0) return { text: 'Out of Stock', color: 'red' };
    if (product.stockQuantity < 10) return { text: 'Low Stock', color: 'orange' };
    return { text: 'In Stock', color: 'green' };
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Products</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedIds.size} product(s) selected • {products.length} products found
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="name">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-desc">Stock: High to Low</option>
                  <option value="rating-desc">Rating: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                <SortAsc className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-600 border-blue-300' : 'border-gray-300 text-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.values(filters).some(filter => 
                  typeof filter === 'string' ? filter !== '' && filter !== 'all' :
                  typeof filter === 'object' ? (filter as any).min > 0 || (filter as any).max < 100000 :
                  filter > 0
                ) && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => updateFilter('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Status
                  </label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => updateFilter('stockStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="inStock">In Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => updateFilter('priceRange', {
                        ...filters.priceRange,
                        min: Number(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => updateFilter('priceRange', {
                        ...filters.priceRange,
                        max: Number(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => updateFilter('rating', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4+ Stars</option>
                    <option value={3}>3+ Stars</option>
                    <option value={2}>2+ Stars</option>
                    <option value={1}>1+ Stars</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear all filters
                </button>
                <div className="text-sm text-gray-500">
                  {products.length} products match your filters
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selection Actions */}
        <div className="px-4 py-2 bg-blue-50 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} products selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAllVisible}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select all visible
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={deselectAll}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Deselect all
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {products.length} of many products
          </div>
        </div>

        {/* Products List/Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const status = getProductStatus(product);
                return (
                  <div
                    key={product._id}
                    className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                      isProductSelected(product._id)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => toggleProductSelection(product)}
                  >
                    <div className="p-4">
                      {/* Product Image */}
                      <div className="relative mb-3">
                        <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                          {product.images?.thumbnail?.url ? (
                            <img
                              src={product.images.thumbnail.url}
                              alt={product.images.thumbnail.altText || product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        {/* Selection Indicator */}
                        <div className="absolute top-2 right-2">
                          {isProductSelected(product._id) ? (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            R{product.offerPrice || product.basePrice}
                          </span>
                          {product.discountPercentage > 0 && (
                            <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                              {product.discountPercentage}% OFF
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>SKU: {product.sku || 'N/A'}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            status.color === 'green' ? 'bg-green-100 text-green-800' :
                            status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status.text}
                          </span>
                        </div>

                        {/* Rating */}
                        {product.averageRating > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {getRatingStars(product.averageRating)}
                            </div>
                            <span className="text-sm text-gray-600">
                              ({product.totalReviews || 0})
                            </span>
                          </div>
                        )}

                        {/* Brand */}
                        {product.brand && (
                          <div className="text-sm text-gray-600">
                            Brand: {typeof product.brand === 'object' ? product.brand.name : product.brand}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {products.map((product) => {
                const status = getProductStatus(product);
                return (
                  <div
                    key={product._id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isProductSelected(product._id)
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => toggleProductSelection(product)}
                  >
                    {/* Selection Indicator */}
                    <div className="mr-4">
                      {isProductSelected(product._id) ? (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                      {product.images?.thumbnail?.url ? (
                        <img
                          src={product.images.thumbnail.url}
                          alt={product.images.thumbnail.altText || product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            SKU: {product.sku || 'N/A'} • 
                            Brand: {typeof product.brand === 'object' ? product.brand.name : 'N/A'}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-semibold text-gray-900">
                              R{product.offerPrice || product.basePrice}
                            </span>
                            {product.discountPercentage > 0 && (
                              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                                {product.discountPercentage}% OFF
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {status.text}
                            </span>
                          </div>

                          {/* Rating */}
                          {product.averageRating > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex">
                                {getRatingStars(product.averageRating)}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({product.totalReviews || 0} reviews)
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-sm text-gray-500">
                            Stock: {product.stockQuantity}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add quick view functionality here
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-gray-600">
            <strong>{selectedIds.size}</strong> products selected for showcase section
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add {selectedIds.size} Product{selectedIds.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;