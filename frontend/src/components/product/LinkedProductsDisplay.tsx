// components/product/LinkedProductsDisplay.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // 🆕 Add this import
import { ProductData } from './productTypes';
import ProductCard from './ProductCard';
import api from '../config/axiosConfig';

interface LinkedProductsDisplayProps {
  productId: string;
  currentProductSlug?: string;
  title?: string;
  maxProducts?: number;
}

const LinkedProductsDisplay: React.FC<LinkedProductsDisplayProps> = ({
  productId,
  currentProductSlug,
  title = "Related Products",
  maxProducts = 8
}) => {
  const [linkedProducts, setLinkedProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const location = useLocation(); // 🆕 Get current location

  useEffect(() => {
    const fetchLinkedProducts = async () => {
      if (!currentProductSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const productResponse = await api.get(`/products/slug/${currentProductSlug}`);
        const productData = productResponse.data.product || productResponse.data;
        
        const linkedProductIds = productData.linkedProducts || [];

        if (linkedProductIds.length === 0) {
          setLinkedProducts([]);
          setLoading(false);
          return;
        }

        const idsToFetch = linkedProductIds.slice(0, maxProducts);
        const batchResponse = await api.get(`/products/by-ids?ids=${idsToFetch.join(',')}`);

        if (batchResponse.data.success && batchResponse.data.products && batchResponse.data.products.length > 0) {
          
          // Filter out current product
          const filteredProducts = batchResponse.data.products.filter((product: ProductData) => {
            const isNotCurrent = product.slug !== currentProductSlug;
            return isNotCurrent;
          });

          setLinkedProducts(filteredProducts);
        } else {
          setLinkedProducts([]);
        }

      } catch (error: any) {
        console.error('❌ Error in fetchLinkedProducts:', error);
        setError('Failed to load related products');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedProducts();
  }, [productId, currentProductSlug, maxProducts, location.pathname]); // 🆕 Add location.pathname as dependency

  // Loading state
  if (loading) {
    return (
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  // No products state
  if (linkedProducts.length === 0) {
    return null;
  }

  // Success state
  return (
    <section className="bg-white py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {linkedProducts.length} product{linkedProducts.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {linkedProducts.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinkedProductsDisplay;