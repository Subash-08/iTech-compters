// components/invoice/CategoryProductSelector.tsx - SIMPLIFIED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  InvoiceProduct, 
  InvoiceCustomProduct, 
  Category, 
  ProductSearchResult
} from '../types/invoice';
import { categoryService, productSearchService } from '../services/invoiceService';
import { 
  Search, Plus, X, Grid, List, 
  Filter, ShoppingBag, TrendingUp, ChevronRight,
  Tag, DollarSign, Package, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

interface CategoryProductSelectorProps {
  products: InvoiceProduct[];
  customProducts: InvoiceCustomProduct[];
  onAddProduct: (product: InvoiceProduct) => void;
  onAddCustomProduct: (product: InvoiceCustomProduct) => void;
  onRemoveProduct: (index: number) => void;
  onRemoveCustomProduct: (index: number) => void;
  onUpdateProduct: (index: number, updates: Partial<InvoiceProduct>) => void;
  onUpdateCustomProduct: (index: number, updates: Partial<InvoiceCustomProduct>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CategoryProductSelector: React.FC<CategoryProductSelectorProps> = ({
  products,
  customProducts,
  onAddProduct,
  onAddCustomProduct,
  onRemoveProduct,
  onRemoveCustomProduct,
  onUpdateProduct,
  onUpdateCustomProduct,
  onBack,
  onNext
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [featuredProducts, setFeaturedProducts] = useState<ProductSearchResult[]>([]);
  const [customProductForm, setCustomProductForm] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    gstPercentage: 18,
    category: '',
    sku: '',
    hsnCode: ''
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
  }, []);

  // Load initial products when category is selected
  useEffect(() => {
    if (selectedCategory && !searchQuery.trim()) {
      loadCategoryProducts(selectedCategory);
    } else if (!selectedCategory && !searchQuery.trim()) {
      // Show featured products when no category selected
      setSearchResults(featuredProducts);
    }
  }, [selectedCategory, searchQuery, featuredProducts]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const results = await productSearchService.searchProducts('');
      // Take first 12 as featured
      setFeaturedProducts(results.slice(0, 12));
      setSearchResults(results.slice(0, 12)); // Set initial display
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  };

  const loadCategoryProducts = async (categorySlug: string) => {
    try {
      setIsSearching(true);
      const results = await productSearchService.searchProducts('', categorySlug);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to load category products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        if (selectedCategory) {
          loadCategoryProducts(selectedCategory);
        } else {
          setSearchResults(featuredProducts);
        }
        return;
      }

      setIsSearching(true);
      try {
        const productResults = await productSearchService.searchProducts(query, selectedCategory);
        setSearchResults(productResults);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [selectedCategory, featuredProducts]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const handleAddProduct = (product: ProductSearchResult) => {
    const effectivePrice = product.effectivePrice || product.salePrice;
    const basePrice = product.basePrice || product.price || product.mrp || 0;
    const unitPrice = effectivePrice || basePrice;
    const gstPercentage = product.gstPercentage || 18;
    const category = product.category || 
                     (product.categories && product.categories[0]?.name) || '';
    const sku = product.sku || product._id.substring(0, 8);
    
    const invoiceProduct: InvoiceProduct = {
      productId: product._id,
      name: product.name,
      sku: sku,
      quantity: 1,
      unitPrice: unitPrice,
      gstPercentage: gstPercentage,
      gstAmount: unitPrice * (gstPercentage / 100),
      total: unitPrice,
      category: category,
      variant: {
        condition: product.condition || 'New',
        brand: product.brand?.name || '',
        originalPrice: basePrice,
        salePrice: effectivePrice || basePrice,
        stock: product.stockQuantity || product.stock || 0
      }
    };
    
    onAddProduct(invoiceProduct);
    toast.success(`Added ${product.name} to invoice`);
  };

  const handleSaveCustomProduct = () => {
    if (!customProductForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const total = customProductForm.quantity * customProductForm.unitPrice;
    const gstAmount = total * (customProductForm.gstPercentage / 100);
    
    const customProduct: InvoiceCustomProduct = {
      ...customProductForm,
      total,
      gstAmount,
      isCustom: true
    };

    onAddCustomProduct(customProduct);
    toast.success('Custom product added');

    // Reset form
    setCustomProductForm({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      gstPercentage: 18,
      category: '',
      sku: '',
      hsnCode: ''
    });
    setShowCustomProductForm(false);
  };

  const getTotalItems = () => {
    return products.length + customProducts.length;
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const renderProductCard = (product: ProductSearchResult) => {
    const effectivePrice = product.effectivePrice || product.salePrice;
    const basePrice = product.basePrice || product.price || product.mrp || 0;
    const displayPrice = effectivePrice || basePrice;
    const isOnSale = effectivePrice && effectivePrice !== basePrice;
    const gstPercentage = product.gstPercentage || 18;
    const stock = product.stockQuantity || product.stock || 0;
    const isOutOfStock = stock <= 0;
    const categoryName = product.category || 
                        (product.categories && product.categories[0]?.name) || '';
    const brandName = product.brand?.name || '';
    const imageUrl = product.images?.thumbnail?.url || 
                    product.images?.main?.url || 
                    '/api/placeholder/200/200';

    return (
      <div key={product._id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/api/placeholder/200/200';
            }}
          />
          {isOnSale && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              SALE
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/70 px-3 py-1.5 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}
          <button
            onClick={() => !isOutOfStock && handleAddProduct(product)}
            disabled={isOutOfStock}
            className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all ${
              isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 shadow-lg'
            }`}
            title={isOutOfStock ? 'Out of Stock' : 'Add to Invoice'}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm h-10">
              {product.name}
            </h3>
          </div>

          {/* Brand and Category */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {brandName && (
              <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                <Tag size={10} />
                {brandName}
              </span>
            )}
            {categoryName && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                <Package size={10} />
                {categoryName}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {isOnSale && basePrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{basePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* GST and Stock */}
          <div className="flex justify-between items-center text-xs">
            <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
              <DollarSign size={10} />
              GST: {gstPercentage}%
            </span>
            <span className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded ${
              isOutOfStock 
                ? 'bg-red-100 text-red-800' 
                : stock <= 5 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              <Clock size={10} />
              {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Add Products & Services</h1>
            <p className="opacity-90 mt-1">Select from catalog or add custom items</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <ShoppingBag size={20} />
            <span className="font-semibold">{getTotalItems()} items added</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-sm opacity-80">Catalog Products</div>
            <div className="text-xl font-bold">{products.length}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-sm opacity-80">Custom Items</div>
            <div className="text-xl font-bold">{customProducts.length}</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, brand, or category..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2"
            >
              {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </button>
            
            <button
              onClick={() => loadFeaturedProducts()}
              className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 flex items-center gap-2"
            >
              <TrendingUp size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCustomProductForm(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 flex items-center gap-2 shadow-md"
          >
            <Plus size={18} />
            Add Custom Product/Service
          </button>
        </div>
      </div>

      {/* Custom Product Form */}
      {showCustomProductForm && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Add Custom Product/Service</h2>
              <p className="text-sm text-gray-600">Enter details for custom item</p>
            </div>
            <button
              onClick={() => setShowCustomProductForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product/Service Name *
              </label>
              <input
                type="text"
                required
                value={customProductForm.name}
                onChange={(e) => setCustomProductForm({...customProductForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter product or service name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={customProductForm.category}
                onChange={(e) => setCustomProductForm({...customProductForm, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Service, Hardware, Software"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={customProductForm.description}
                onChange={(e) => setCustomProductForm({...customProductForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Product/Service description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Optional)
              </label>
              <input
                type="text"
                value={customProductForm.sku}
                onChange={(e) => setCustomProductForm({...customProductForm, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., CUST-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={customProductForm.quantity}
                onChange={(e) => setCustomProductForm({...customProductForm, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={customProductForm.unitPrice}
                onChange={(e) => setCustomProductForm({...customProductForm, unitPrice: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={customProductForm.gstPercentage}
                onChange={(e) => setCustomProductForm({...customProductForm, gstPercentage: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HSN Code (Optional)
              </label>
              <input
                type="text"
                value={customProductForm.hsnCode}
                onChange={(e) => setCustomProductForm({...customProductForm, hsnCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 8471"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCustomProductForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomProduct}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90"
            >
              Add to Invoice
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Browse Categories</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Categories
            {selectedCategory === '' && <ChevronRight size={16} />}
          </button>
          {categories.slice(0, 15).map(category => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 ${
                selectedCategory === category.slug
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
              {selectedCategory === category.slug && <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {searchQuery 
                ? `Search Results for "${searchQuery}"` 
                : selectedCategory 
                ? `${categories.find(c => c.slug === selectedCategory)?.name || 'Category'} Products`
                : 'Featured Products'}
            </h2>
            <p className="text-gray-600">
              {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
              {selectedCategory && ` in this category`}
            </p>
          </div>
        </div>

        {/* Products Display */}
        {isSearching ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {searchResults.map(product => renderProductCard(product))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No products found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery 
                ? 'Try different search terms' 
                : selectedCategory 
                ? 'No products in this category'
                : 'Select a category or search for products'}
            </p>
          </div>
        )}
      </div>

      {/* Added Items Summary */}
      {(products.length > 0 || customProducts.length > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Added Items ({getTotalItems()})</h2>
          
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={`product-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Qty: 
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => onUpdateProduct(index, {
                          quantity: parseInt(e.target.value) || 1
                        })}
                        className="ml-2 w-16 px-2 py-1 border rounded"
                      />
                    </span>
                    <span>Price: ₹
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => onUpdateProduct(index, {
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                        className="ml-2 w-24 px-2 py-1 border rounded"
                      />
                    </span>
                    <span>GST: 
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={product.gstPercentage}
                        onChange={(e) => onUpdateProduct(index, {
                          gstPercentage: parseFloat(e.target.value) || 0
                        })}
                        className="ml-2 w-16 px-2 py-1 border rounded"
                      />%
                    </span>
                    <span className="font-medium">
                      Total: ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveProduct(index)}
                  className="p-2 text-red-600 hover:text-red-800 ml-4"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            {customProducts.map((product, index) => (
              <div key={`custom-${index}`} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Custom</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: 
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => onUpdateCustomProduct(index, {
                          quantity: parseInt(e.target.value) || 1
                        })}
                        className="ml-2 w-16 px-2 py-1 border rounded"
                      />
                    </span>
                    <span>Price: ₹
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.unitPrice}
                        onChange={(e) => onUpdateCustomProduct(index, {
                          unitPrice: parseFloat(e.target.value) || 0
                        })}
                        className="ml-2 w-24 px-2 py-1 border rounded"
                      />
                    </span>
                    <span>GST: 
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={product.gstPercentage}
                        onChange={(e) => onUpdateCustomProduct(index, {
                          gstPercentage: parseFloat(e.target.value) || 0
                        })}
                        className="ml-2 w-16 px-2 py-1 border rounded"
                      />%
                    </span>
                    <span className="font-medium">
                      Total: ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveCustomProduct(index)}
                  className="p-2 text-red-600 hover:text-red-800 ml-4"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to Customer
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={getTotalItems() === 0}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Review Invoice
        </button>
      </div>
    </div>
  );
};

export default CategoryProductSelector;