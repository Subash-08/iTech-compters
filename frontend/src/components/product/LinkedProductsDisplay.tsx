// components/product/LinkedProductsDisplay.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductData } from './productTypes';
import ProductCard from './ProductCard';
import api from '../config/axiosConfig';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

interface LinkedProductsDisplayProps {
  productId: string;
  currentProductSlug?: string;
  title?: string;
  maxProducts?: number;
}

// 🧠 LOGIC: Enhanced transformation with stock calculation (Kept as provided)
const transformProductData = (apiProduct: any): ProductData => {
  let actualStockQuantity = 0;
  
  if (apiProduct.variants && apiProduct.variants.length > 0) {
    actualStockQuantity = apiProduct.variants.reduce((sum: number, variant: any) => {
      return sum + (variant.stockQuantity || 0);
    }, 0);
  } else {
    actualStockQuantity = apiProduct.stockQuantity || apiProduct.totalStock || 0;
  }
  
  const hasStock = actualStockQuantity > 0;
  
  return {
    _id: apiProduct._id || apiProduct.id || '',
    name: apiProduct.name || '',
    slug: apiProduct.slug || '',
    effectivePrice: apiProduct.sellingPrice || apiProduct.lowestPrice || apiProduct.basePrice || apiProduct.price || 0,
    mrp: apiProduct.mrp || apiProduct.displayMrp || apiProduct.basePrice || 0,
    stockQuantity: actualStockQuantity,
    hasStock: hasStock,
    condition: apiProduct.condition || 'New',
    averageRating: apiProduct.averageRating || apiProduct.rating || 0,
    totalReviews: apiProduct.totalReviews || 0,
    images: apiProduct.images || {},
    brand: apiProduct.brand || {},
    variants: apiProduct.variants || [],
    variantConfiguration: apiProduct.variantConfiguration || {},
    basePrice: apiProduct.basePrice || apiProduct.sellingPrice || 0,
    isOnSale: apiProduct.isOnSale || false,
    discountPercentage: apiProduct.discountPercentage || 0,
    ...apiProduct
  };
};

const LinkedProductsDisplay: React.FC<LinkedProductsDisplayProps> = ({
  productId,
  currentProductSlug,
  title = "You Might Also Like",
  maxProducts = 4 // Default to 4 for a clean single row
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
        
        // Main API Call
        const response = await api.get(`/products/linked/${currentProductSlug}?limit=${maxProducts}`);
        
        if (response.data.success && response.data.data?.linkedProducts) {
          const transformedProducts = response.data.data.linkedProducts.map(transformProductData);
          setLinkedProducts(transformedProducts);
        } else {
          setLinkedProducts([]);
        }

      } catch (error: any) {
        console.error('❌ Error fetching linked products:', error);
        
        // Fallback Logic (Kept as provided)
        try {
          const currentProductRes = await api.get(`/products/slug/${currentProductSlug}`);
          const linkedProductIds = currentProductRes.data.data?.product?.linkedProducts || [];
          
          if (linkedProductIds.length > 0) {
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
          setError('Failed to load recommendations');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedProducts();
  }, [currentProductSlug, maxProducts, location.pathname]);

  // Loading Skeleton (Matching Card Aspect Ratio)
  if (loading) {
    return (
      <section className="w-full border-t border-gray-100">
        <div className="flex items-center space-x-2">
           <div className="h-8 w-48 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse space-y-4">
              <div className="bg-gray-100 aspect-[4/5] rounded-2xl w-full"></div>
              <div className="space-y-2">
                 <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                 <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Hide section completely if empty (Cleaner UI)
  if (linkedProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full mt-16 pt-12 border-t border-gray-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 hidden sm:block">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Curated picks based on your viewing history</p>
          </div>
        </div>
        
        {/* Optional: 'View All' Link could go here */}
      </div>
           
      {/* Product Grid with Stagger Animation */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {linkedProducts.map((product) => (
          <motion.div
            key={product._id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <ProductCard 
              product={product}
              // Ensure ProductCard manages its own height/styles, or pass classNames here if supported
            />
          </motion.div>
        ))}
      </motion.div>

    </section>
  );
};

export default LinkedProductsDisplay;