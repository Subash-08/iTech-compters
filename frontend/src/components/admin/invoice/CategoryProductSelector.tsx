// components/invoice/CategoryProductSelector.tsx - USER FRIENDLY VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  InvoiceProduct, 
  InvoiceCustomProduct, 
  InvoicePreBuiltPC, 
  Category, 
  ProductSearchResult, 
  PreBuiltPCSearchResult 
} from '../types/invoice';
import { categoryService, productSearchService, preBuiltPCService } from '../services/invoiceService';
import { 
  Search, Plus, X, Package, Cpu, Edit, Grid, List, 
  Filter, ShoppingBag, Tag, Star, TrendingUp, Zap 
} from 'lucide-react';
import { toast } from 'react-toastify';

interface CategoryProductSelectorProps {
  products: InvoiceProduct[];
  customProducts: InvoiceCustomProduct[];
  preBuiltPCs: InvoicePreBuiltPC[];
  onAddProduct: (product: InvoiceProduct) => void;
  onAddCustomProduct: (product: InvoiceCustomProduct) => void;
  onAddPreBuiltPC: (pc: InvoicePreBuiltPC) => void;
  onRemoveProduct: (index: number) => void;
  onRemoveCustomProduct: (index: number) => void;
  onRemovePreBuiltPC: (index: number) => void;
  onUpdateProduct: (index: number, updates: Partial<InvoiceProduct>) => void;
  onUpdateCustomProduct: (index: number, updates: Partial<InvoiceCustomProduct>) => void;
  onUpdatePreBuiltPC: (index: number, updates: Partial<InvoicePreBuiltPC>) => void;
  onBack: () => void;
  onNext: () => void;
}

const CategoryProductSelector: React.FC<CategoryProductSelectorProps> = ({
  products,
  customProducts,
  preBuiltPCs,
  onAddProduct,
  onAddCustomProduct,
  onAddPreBuiltPC,
  onRemoveProduct,
  onRemoveCustomProduct,
  onRemovePreBuiltPC,
  onUpdateProduct,
  onUpdateCustomProduct,
  onUpdatePreBuiltPC,
  onBack,
  onNext
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [preBuiltPCResults, setPreBuiltPCResults] = useState<PreBuiltPCSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPreBuiltPCs, setShowPreBuiltPCs] = useState(false);
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [featuredProducts, setFeaturedProducts] = useState<ProductSearchResult[]>([]);
  
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
      setSearchResults([]);
      setPreBuiltPCResults([]);
    }
  }, [selectedCategory, searchQuery]);

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
      const results = await productSearchService.searchProducts('', '');
      // Take first 8 as featured
      setFeaturedProducts(results.slice(0, 8));
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  };

  const loadCategoryProducts = async (categorySlug: string) => {
    try {
      setIsSearching(true);
      const results = await productSearchService.searchProducts('', categorySlug);
      setSearchResults(results.slice(0, 12));
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
        }
        return;
      }

      setIsSearching(true);
      try {
        if (showPreBuiltPCs) {
          // Search pre-built PCs
          const pcResults = await preBuiltPCService.searchPreBuiltPCs(query);
          setPreBuiltPCResults(pcResults);
          setSearchResults([]);
        } else {
          // Search products
          const productResults = await productSearchService.searchProducts(query, selectedCategory);
          setSearchResults(productResults);
          setPreBuiltPCResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [selectedCategory, showPreBuiltPCs]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const handleAddProduct = (product: ProductSearchResult) => {
    console.log('Adding product:', product);
    
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

  const handleAddPreBuiltPC = (pc: PreBuiltPCSearchResult) => {
    const invoicePC: InvoicePreBuiltPC = {
      pcId: pc._id,
      name: pc.name,
      components: pc.components?.map(comp => ({
        name: comp.product?.name || '',
        sku: comp.product?.sku || '',
        quantity: comp.quantity || 1,
        unitPrice: comp.product?.price || 0
      })) || [],
      quantity: 1,
      unitPrice: pc.salePrice || pc.price || 0,
      gstPercentage: pc.gstPercentage || 18,
      gstAmount: (pc.salePrice || pc.price || 0) * ((pc.gstPercentage || 18) / 100),
      total: pc.salePrice || pc.price || 0
    };
    onAddPreBuiltPC(invoicePC);
    toast.success(`Added ${pc.name} to invoice`);
  };

  const getTotalItems = () => {
    return products.length + customProducts.length + preBuiltPCs.length;
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
      <div key={product._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {isOnSale && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
              {product.name}
            </h3>
            <button
              onClick={() => handleAddProduct(product)}
              disabled={isOutOfStock}
              className={`ml-2 p-2 rounded-full ${
                isOutOfStock 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Invoice'}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Brand and Category */}
          <div className="flex items-center gap-2 mb-3">
            {brandName && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {brandName}
              </span>
            )}
            {categoryName && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {categoryName}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {isOnSale && basePrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{basePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* GST and Stock */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              GST: {gstPercentage}%
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isOutOfStock 
                ? 'bg-red-100 text-red-800' 
                : stock <= 5 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {isOutOfStock ? 'Out of Stock' : `Stock: ${stock}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPreBuiltPCCard = (pc: PreBuiltPCSearchResult) => {
    const price = pc.salePrice || pc.price || 0;
    const imageUrl = pc.images?.thumbnail?.url || '/api/placeholder/200/200';

    return (
      <div key={pc._id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* PC Image */}
        <div className="relative h-48 bg-gradient-to-r from-blue-100 to-indigo-100">
          <img 
            src={imageUrl} 
            alt={pc.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            PRE-BUILT
          </div>
        </div>

        {/* PC Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
              {pc.name}
            </h3>
            <button
              onClick={() => handleAddPreBuiltPC(pc)}
              className="ml-2 p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              title="Add to Invoice"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Price */}
          <div className="mb-3">
            <span className="text-xl font-bold text-gray-900">
              ₹{price.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Components Preview */}
          {pc.components && pc.components.length > 0 && (
            <div className="text-xs text-gray-600 mb-3">
              <span className="font-medium">Includes:</span>{' '}
              {pc.components.slice(0, 2).map(c => c.product?.name || '').join(', ')}
              {pc.components.length > 2 && '...'}
            </div>
          )}

          {/* GST */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              GST: {pc.gstPercentage || 18}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Add Products to Invoice</h1>
            <p className="opacity-90">Browse, search, or add custom items</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <ShoppingBag size={20} />
            <span className="font-semibold">{getTotalItems()} items added</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-sm opacity-80">Catalog Products</div>
            <div className="text-xl font-bold">{products.length}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-sm opacity-80">Custom Items</div>
            <div className="text-xl font-bold">{customProducts.length}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <div className="text-sm opacity-80">Pre-built PCs</div>
            <div className="text-xl font-bold">{preBuiltPCs.length}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                showPreBuiltPCs 
                  ? "Search pre-built PCs by name, specs..." 
                  : "Search products by name, SKU, brand..."
              }
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
              onClick={() => setShowPreBuiltPCs(!showPreBuiltPCs)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 ${
                showPreBuiltPCs 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showPreBuiltPCs ? <Package size={18} /> : <Cpu size={18} />}
              {showPreBuiltPCs ? 'PCs' : 'Products'}
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCustomProductForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Custom Item
          </button>
          
          <button
            onClick={() => loadFeaturedProducts()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <TrendingUp size={18} />
            Show Featured
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Browse Categories</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg border ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 12).map(category => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 rounded-lg border ${
                selectedCategory === category.slug
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category.name}
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
                : showPreBuiltPCs 
                ? 'Pre-built PCs'
                : 'Featured Products'}
            </h2>
            <p className="text-gray-600">
              {showPreBuiltPCs 
                ? `${preBuiltPCResults.length} PCs found`
                : `${searchResults.length || featuredProducts.length} products found`}
            </p>
          </div>
        </div>

        {/* Products Display */}
        {isSearching ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            {showPreBuiltPCs ? (
              // Pre-built PCs Grid
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {preBuiltPCResults.length > 0 ? (
                  preBuiltPCResults.map(pc => renderPreBuiltPCCard(pc))
                ) : searchQuery ? (
                  <div className="col-span-full text-center py-12">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No pre-built PCs found</p>
                    <p className="text-sm text-gray-500 mt-1">Try different search terms</p>
                  </div>
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Search for pre-built PCs</p>
                    <p className="text-sm text-gray-500 mt-1">Type in the search box above to find PCs</p>
                  </div>
                )}
              </div>
            ) : (
              // Products Grid
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {(searchResults.length > 0 ? searchResults : featuredProducts).map(product => 
                  viewMode === 'grid' ? renderProductCard(product) : (
                    <div key={product._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={product.images?.thumbnail?.url || '/api/placeholder/200/200'} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                          <div className="flex gap-4 mb-3">
                            <span className="text-lg font-bold text-blue-600">
                              ₹{(product.effectivePrice || product.basePrice || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm text-gray-500">
                              GST: {product.gstPercentage || 18}%
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddProduct(product)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add to Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {searchResults.length === 0 && !searchQuery && featuredProducts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No products found</p>
                    <p className="text-sm text-gray-500 mt-1">Select a category or search for products</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Added Items Summary */}
      {(products.length > 0 || customProducts.length > 0 || preBuiltPCs.length > 0) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Added Items ({getTotalItems()})</h2>
          
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={`product-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: {product.quantity}</span>
                    <span>Price: ₹{product.unitPrice.toFixed(2)}</span>
                    <span>Total: ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveProduct(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            {customProducts.map((product, index) => (
              <div key={`custom-${index}`} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Custom</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: {product.quantity}</span>
                    <span>Price: ₹{product.unitPrice.toFixed(2)}</span>
                    <span>Total: ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveCustomProduct(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            {preBuiltPCs.map((pc, index) => (
              <div key={`pc-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{pc.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Qty: {pc.quantity}</span>
                    <span>Price: ₹{pc.unitPrice.toFixed(2)}</span>
                    <span>Total: ₹{calculateItemTotal(pc.quantity, pc.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemovePreBuiltPC(index)}
                  className="p-2 text-red-600 hover:text-red-800"
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
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Review Invoice
        </button>
      </div>
    </div>
  );
};

export default CategoryProductSelector;