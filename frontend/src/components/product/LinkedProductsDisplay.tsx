// components/product/LinkedProductsDisplay.tsx - UPDATED WITH STOCK FIX
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductData } from './productTypes';
import ProductCard from './ProductCard';
import api from '../config/axiosConfig';

interface LinkedProductsDisplayProps {
  productId: string;
  currentProductSlug?: string;
  title?: string;
  maxProducts?: number;
}

// Enhanced transformation function with stock calculation
const transformProductData = (apiProduct: any): ProductData => {
  
  // Calculate actual stock
  let actualStockQuantity = 0;
  
  if (apiProduct.variants && apiProduct.variants.length > 0) {
    // Sum stock from all variants
    actualStockQuantity = apiProduct.variants.reduce((sum: number, variant: any) => {
      return sum + (variant.stockQuantity || 0);
    }, 0);
  } else {
    // Use main product stock
    actualStockQuantity = apiProduct.stockQuantity || apiProduct.totalStock || 0;
  }
  
  // Determine if in stock
  const hasStock = actualStockQuantity > 0;
  
  return {
    _id: apiProduct._id || apiProduct.id || '',
    name: apiProduct.name || '',
    slug: apiProduct.slug || '',
    
    // Price handling
    effectivePrice: apiProduct.sellingPrice || apiProduct.lowestPrice || apiProduct.basePrice || apiProduct.price || 0,
    mrp: apiProduct.mrp || apiProduct.displayMrp || apiProduct.basePrice || 0,
    
    // Stock handling - use calculated values
    stockQuantity: actualStockQuantity,
    hasStock: hasStock,
    
    // Other properties
    condition: apiProduct.condition || 'New',
    averageRating: apiProduct.averageRating || apiProduct.rating || 0,
    totalReviews: apiProduct.totalReviews || 0,
    
    // Images
    images: apiProduct.images || {},
    
    // Brand
    brand: apiProduct.brand || {},
    
    // Variants
    variants: apiProduct.variants || [],
    variantConfiguration: apiProduct.variantConfiguration || {},
    
    // Additional fields
    basePrice: apiProduct.basePrice || apiProduct.sellingPrice || 0,
    isOnSale: apiProduct.isOnSale || false,
    discountPercentage: apiProduct.discountPercentage || 0,
    
    // Copy all other properties
    ...apiProduct
  };
};

const LinkedProductsDisplay: React.FC<LinkedProductsDisplayProps> = ({
  productId,
  currentProductSlug,
  title = "Related Products",
  maxProducts = 8
}) => {
  const [linkedProducts, setLinkedProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const fetchLinkedProducts = async () => {
      if (!currentProductSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
           const response = await api.get(`/products/linked/${currentProductSlug}?limit=${maxProducts}`);
        
        if (response.data.success && response.data.data?.linkedProducts) {
          // Transform each product
          const transformedProducts = response.data.data.linkedProducts.map(transformProductData);
          setLinkedProducts(transformedProducts);
        } else {
          setLinkedProducts([]);
        }

      } catch (error: any) {
        console.error('❌ Error fetching linked products:', error);
        
        // 🆕 FALLBACK: Try to fetch products individually if batch API fails
        try {
          // First get the current product to get linked product IDs
          const currentProductRes = await api.get(`/products/slug/${currentProductSlug}`);
          const linkedProductIds = currentProductRes.data.data?.product?.linkedProducts || [];
          
          if (linkedProductIds.length > 0) {
            // Fetch each linked product individually
            const productPromises = linkedProductIds.map((id: string) => 
              api.get(`/products/${id}`).catch(() => null)
            );
            
            const productResponses = await Promise.all(productPromises);
            const validProducts = productResponses
              .filter(res => res?.data?.success && res.data.data?.product)
              .map(res => res.data.data.product);
            
            const transformedProducts = validProducts.map(transformProductData);
            setLinkedProducts(transformedProducts.slice(0, maxProducts));
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setError('Failed to load linked products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedProducts();
  }, [currentProductSlug, maxProducts, location.pathname]);

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