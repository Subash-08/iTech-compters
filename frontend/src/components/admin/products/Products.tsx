import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductGrid from './ProductGrid';
import ProductFilters from './ProductFilters';
import { Product, ProductsResponse, ProductFilters as FiltersType } from '../types/product';
import api from '../../config/axiosConfig'; // Import your axios config

const Products: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    category: '',
    brand: '',
    status: '',
    inStock: '',
    sort: 'newest',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1
  });

  // Fetch products using Axios
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/admin/products?${queryParams}`);

      const data: ProductsResponse = response.data;

      if (data.success) {
        setProducts(data.products);
        setPagination({
          totalProducts: data.totalProducts,
          totalPages: data.totalPages,
          currentPage: data.currentPage
        });
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    console.log(product);
    
    setShowForm(true);
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const payload = { status: newStatus };

      const response = await api.patch(`/admin/products/${productId}/status`, payload);

      console.log('✅ Status update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('💥 Error updating product status:', error);
      throw error;
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await api.delete(`/admin/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Handle form submission for both create and edit using Axios
  const handleSubmit = async (formData: ProductFormData) => {
    setLoading(true);
    setError(null);
    try {
      const url = editingProduct 
        ? `/admin/product/${editingProduct._id}` // Update endpoint
        : '/admin/product/new'; // Create endpoint

      const method = editingProduct ? 'put' : 'post';

      const response = await api[method](url, formData);

      console.log('Product saved:', response.data);
      setShowForm(false);
      setEditingProduct(null); // Reset editing state
      fetchProducts(); // Refresh the list
      alert(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error instanceof Error ? error.message : 'Error saving product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const retryFetch = () => {
    fetchProducts();
  };

  if (showForm) {
    return (
      <ProductForm 
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        initialData={editingProduct} // Pass the product being edited
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog {pagination.totalProducts > 0 && `(${pagination.totalProducts} products)`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Add New Product
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={retryFetch}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <ProductFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Products Grid */}
      <ProductGrid
        products={products}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={fetchProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default Products;