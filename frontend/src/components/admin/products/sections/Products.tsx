import React, { useState } from 'react';
import ProductForm from '../ProductForm';
import { ProductFormData } from '../../types/product';
import api from '../../../config/axiosConfig'; // Import your axios config

const Products: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    setLoading(true);
    try {
      const response = await api.post('/products', formData);
      setShowForm(false);
      // Show success message
    } catch (error) {
      console.error('Error creating product:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <ProductForm 
        onSubmit={handleSubmit}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Add New Product
        </button>
      </div>

      {/* Products list would go here */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-600 mb-4">Get started by adding your first product to the catalog.</p>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Add Your First Product
        </button>
      </div>
    </div>
  );
};

export default Products;