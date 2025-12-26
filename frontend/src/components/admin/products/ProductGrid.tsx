import React, { useState } from 'react';
import { Product } from '../types/product';
import { baseURL } from '../../config/config';

interface Pagination {
  totalProducts: number;
  totalPages: number;
  currentPage: number;
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => Promise<void>;
  onStatusChange: (productId: string, newStatus: string) => Promise<void>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  pagination,
  onPageChange,
  onRefresh,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [deletingProducts, setDeletingProducts] = useState<Record<string, boolean>>({});

// In ProductGrid.tsx
// In ProductGrid.tsx - Update the handleStatusChange function
const handleStatusChange = async (productId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [productId]: true }));
    
    try {
        await onStatusChange(productId, newStatus);
        
        // Show success message
        
        // 🔥 CRITICAL: Refresh the product list to get updated data
        onRefresh();
        
    } catch (error) {
        console.error('💥 Error updating product status:', error);
        
        // Show user-friendly error message
        alert(`Failed to update status: ${error.message}`);
        
        // Refresh anyway to get correct status from server
        onRefresh();
    } finally {
        setUpdatingStatus(prev => ({ ...prev, [productId]: false }));
    }
};

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingProducts(prev => ({ ...prev, [productId]: true }));
    try {
      await onDelete(productId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    } finally {
      setDeletingProducts(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleEdit = (product: Product) => {
    const formReadyProduct = transformProductForForm(product);
    onEdit(formReadyProduct);    
  };

const transformProductForForm = (product: Product): any => {
  return {
    name: product.name || '',
    brand: typeof product.brand === 'object' ? product.brand._id : product.brand || '',
    categories: Array.isArray(product.categories) 
      ? product.categories.map(cat => typeof cat === 'object' ? cat._id : cat)
      : [],
    tags: product.tags || [],
    condition: product.condition || 'New',
    label: product.label || '',
    isActive: product.isActive !== undefined ? product.isActive : true,
    status: product.status || 'Draft',
    description: product.description || '',
    definition: product.definition || '',
    
    // 🆕 NEW FIELDS
    hsn: product.hsn || '',
    mrp: product.mrp || 0,
    manufacturerImages: product.manufacturerImages || [],
    
    images: {
      thumbnail: product.images?.thumbnail || { url: '', altText: '' },
      hoverImage: product.images?.hoverImage || undefined,
      gallery: product.images?.gallery || []
    },
    
    basePrice: product.basePrice || 0,
    offerPrice: product.offerPrice || 0,
    discountPercentage: product.discountPercentage || 0,
    taxRate: product.taxRate || 0,
    sku: product.sku || '',
    barcode: product.barcode || '',
    stockQuantity: product.stockQuantity || 0,
    
    variantConfiguration: product.variantConfiguration || {
      hasVariants: false,
      variantType: 'None',
      variantCreatingSpecs: [],
      variantAttributes: []
    },
    variants: product.variants || [],
    
    specifications: product.specifications || [],
    features: product.features || [],
    
    dimensions: product.dimensions || {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    },
    weight: product.weight || {
      value: 0,
      unit: 'kg'
    },
    
    warranty: product.warranty || '',
    meta: product.meta || {
      title: '',
      description: '',
      keywords: []
    },
    canonicalUrl: product.canonicalUrl || '',
    linkedProducts: product.linkedProducts || [],
    notes: product.notes || '',
    
    _id: product._id || product.id
  };
};

const getImageUrl = (imageObj: any) => {
  if (!imageObj?.url) return '/placeholder-image.jpg';
    
  const url = imageObj.url;
  
  // 1. If it's already a full URL or blob URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  // Use environment variable or fallback
  const API_BASE_URL = import.meta.env.VITE_API_URL || baseURL;
  
  // 2. Handle cases where it is just a filename (no slashes)
  if (!url.includes('/')) {
     if (url.startsWith('products-')) {
        return `${API_BASE_URL}/uploads/products/${url}`;
     }
     if (url.startsWith('brands-')) {
        return `${API_BASE_URL}/uploads/brands/${url}`;
     }
     return `${API_BASE_URL}/uploads/products/${url}`;
  }
  
  // 3. Handle paths that already start with /uploads/
  if (url.startsWith('/uploads/')) {
    const filename = url.split('/').pop();
    
    if (filename && filename.startsWith('products-') && !url.includes('/products/')) {
       return `${API_BASE_URL}/uploads/products/${filename}`;
    }
    if (filename && filename.startsWith('brands-') && !url.includes('/brands/')) {
       return `${API_BASE_URL}/uploads/brands/${filename}`;
    }

    return `${API_BASE_URL}${url}`;
  }
  
  // 4. Fallback for other relative paths
  return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
};
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'outofstock': return 'bg-red-100 text-red-800 border-red-200';
      case 'archived': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'discontinued': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'outofstock': return 'Out of Stock';
      case 'archived': return 'Archived';
      case 'discontinued': return 'Discontinued';
      default: return status || 'Draft';
    }
  };

const getStockColor = (stock: number, hasVariants: boolean) => {
  if (hasVariants) return 'bg-blue-100 text-blue-800';
  if (stock > 10) return 'bg-green-100 text-green-800';
  if (stock > 0) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 mb-4">
          {pagination.totalProducts === 0 
            ? "Get started by adding your first product to the catalog."
            : "Try adjusting your search or filter criteria."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-900">
              {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''} total
            </span>
            <p className="text-sm text-gray-500">
              Showing {Math.min(products.length, 12)} per page
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category & Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id || product.id} className="hover:bg-gray-50 transition-colors">
                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
 <img
  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
  src={getImageUrl(product.images?.thumbnail)}
  alt={product.images?.thumbnail?.altText || product.name}
  onError={(e) => {
    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEMyNS42NTQ4IDI0IDI3IDI1LjM0NTIgMjcgMjdDMjcgMjguNjU0OCAyNS42NTQ4IDMwIDI0IDMwQzIyLjM0NTIgMzAgMjEgMjguNjU0OCAyMSAyN0MyMSAyNS4zNDUyIDIyLjM0NTIgMjQgMjQgMjRaIiBmaWxsPSIjOEE4QThBIi8+CjxwYXRoIGQ9Ik0zNiAyM0MzNiAyMS44OTU0IDM1LjEwNDYgMjEgMzQgMjFMMjkgMjFDMjcuODk1NCAyMSAyNyAyMS44OTU0IDI3IDIzTDI3IDM2QzI3IDM3LjEwNDYgMjcuODk1NCAzOCAyOSAzOEwzNCAzOEMzNS4xMDQ2IDM4IDM2IDM3LjEwNDYgMzYgMzZMMzYgMjNaIiBmaWxsPSIjOEE4QThBIi8+Cjwvc3ZnPgo=';
  }}
/>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          {product.sku}
                        </div>
                        {!product.isActive && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category & Brand */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {typeof product.brand === 'object' ? product.brand.name : product.brand || 'No brand'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Array.isArray(product.categories) && product.categories.length > 0 
                        ? typeof product.categories[0] === 'object' 
                          ? product.categories[0].name 
                          : product.categories[0]
                        : 'Uncategorized'
                      }
                      {product.categories && product.categories.length > 1 && (
                        <span className="text-xs text-gray-400 ml-1">
                          +{product.categories.length - 1} more
                        </span>
                      )}
                    </div>
                  </td>

{/* Price */}
<td className="px-6 py-4">
  <div className="flex flex-col space-y-1">
    {/* 🆕 Use virtual fields for pricing display */}
    {product.priceRange?.hasRange ? (
      // Show price range for products with variants
      <div className="text-sm font-medium text-gray-900">
        ₹{product.priceRange.min.toFixed(2)} - ₹{product.priceRange.max.toFixed(2)}
      </div>
    ) : (
      // Show single price for products without variants
      <div className="text-sm font-medium text-gray-900">
       ₹{(product.sellingPrice ?? product.basePrice ?? product.offerPrice ?? 0).toFixed(2)}

      </div>
    )}
    
    {/* 🆕 Show MRP and discount if available */}
    {product.displayMrp && product.displayMrp > (product.sellingPrice || product.basePrice) && (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 line-through">
          ₹{product.displayMrp.toFixed(2)}
        </span>
        {product.calculatedDiscount > 0 && (
          <span className="text-xs text-green-600 font-medium">
            {product.calculatedDiscount}% OFF
          </span>
        )}
      </div>
    )}
    
    {/* 🆕 Backward compatibility - show old pricing if virtual fields not available */}
    {!product.displayMrp && product.offerPrice > 0 && product.offerPrice < product.basePrice && (
      <div className="text-sm text-green-600 font-medium">
        ₹{product.offerPrice.toFixed(2)}
        <span className="text-xs text-red-600 ml-1">
          (-{Math.round(((product.basePrice - product.offerPrice) / product.basePrice) * 100)}%)
        </span>
      </div>
    )}
  </div>
</td>



                  {/* Status with Dropdown */}
                  <td className="px-6 py-4">
                    <div className="relative">
                    <select
                      value={product.status || 'Draft'}
                      onChange={(e) => handleStatusChange(product._id || product.id, e.target.value)}
                      disabled={updatingStatus[product._id || product.id]}
                      className={`w-full text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                        getStatusColor(product.status)
                      } ${updatingStatus[product._id || product.id] ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="OutOfStock">Out of Stock</option>
                      <option value="Archived">Archived</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                      {updatingStatus[product._id || product.id] && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {getStatusDisplay(product.status)}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.createdAt ? formatDate(product.createdAt) : 'N/A'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm flex items-center transition-colors"
                        title="Edit Product"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          const productUrl = `/product/${product.slug}`;
                          window.open(productUrl, '_blank');
                        }}
                        className="text-green-600 hover:text-green-900 font-medium text-sm flex items-center transition-colors"
                        title="View Product"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                     {/* <button
                        onClick={() => handleDelete(product._id || product.id)}
                        disabled={deletingProducts[product._id || product.id]}
                        className="text-red-600 hover:text-red-900 font-medium text-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Product"
                      >
                        {deletingProducts[product._id || product.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>

                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </>
                        )}
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full space-y-3 sm:space-y-0">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{(pagination.currentPage - 1) * 12 + 1}</span> -{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * 12, pagination.totalProducts)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalProducts}</span> products
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              <div className="hidden md:flex space-x-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium min-w-[2.5rem] justify-center transition-colors ${
                        pagination.currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;