// src/components/product/ProductDisplay.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/axiosConfig';
import ProductImages from './ProductImages';
import ProductInfo from './ProductInfo';
import ProductSpecifications from './ProductSpecifications';
import ProductFeatures from './ProductFeatures';
import ProductDimensions from './ProductDimensions';
import ProductReviewsSection from '../review/ProductReviewsSection'; // Add this import
import { ProductData, Variant } from './productTypes';

const ProductDisplay: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!slug) {
          setError('Product identifier is missing');
          setLoading(false);
          return;
        }

        const endpoints = [
          `/products/slug/${slug}`,
          `/products/${slug}`
        ];

        let productData: ProductData | null = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
          try {
            const response = await api.get(endpoint);
            const data = response.data;
            productData = data.product || data;
            break;
          } catch (err: any) {
            lastError = err.response?.data?.message || err.message || 'Unknown error';
            continue;
          }
        }

        if (!productData) {
          throw new Error(`Product not found. ${lastError ? `Last error: ${lastError}` : ''}`);
        }
      
        if (!productData.variants || !Array.isArray(productData.variants)) {
          productData.variants = [];
        }
        
        setProductData(productData);
        
        // Handle variants with extensive validation
        if (productData.variants.length > 0) {
          const validVariants = productData.variants.filter(variant => 
            variant && 
            typeof variant === 'object' && 
            variant.identifyingAttributes &&
            Array.isArray(variant.identifyingAttributes)
          );
          
          if (validVariants.length > 0) {
            const defaultVariant = validVariants.find(v => v.isActive) || validVariants[0];
            
            setSelectedVariant(defaultVariant);
            
            // Build attributes safely
            const defaultAttributes: Record<string, string> = {};
            defaultVariant.identifyingAttributes.forEach(attr => {
              if (attr && attr.key && attr.value) {
                defaultAttributes[attr.key] = attr.value;
              }
            });
            setSelectedAttributes(defaultAttributes);
          } else {
            setSelectedVariant(null);
          }
        } else {
          setSelectedVariant(null);
        }
        
      } catch (err) {
        console.error('❌ Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Find variant based on selected attributes
  const findVariantByAttributes = (attributes: Record<string, string>): Variant | null => {
    if (!productData || !productData.variants) return null;
    
    return productData.variants.find(variant => 
      variant.identifyingAttributes.every(attr => 
        attributes[attr.key] === attr.value
      )
    ) || null;
  };

  // Find the best compatible variant when exact match isn't available
  const findBestCompatibleVariant = (targetAttributes: Record<string, string>) => {
    if (!productData?.variants) return null;
    
    const activeVariants = productData.variants.filter(v => v.isActive && (v.stockQuantity || 0) > 0);
    
    // Score variants based on how many attributes match
    const scoredVariants = activeVariants.map(variant => {
      if (!variant.identifyingAttributes) return { variant, score: 0 };
      
      const variantAttrs = {};
      variant.identifyingAttributes.forEach(attr => {
        variantAttrs[attr.key] = attr.value;
      });
      
      let score = 0;
      let priorityScore = 0;
      
      Object.keys(targetAttributes).forEach(key => {
        if (targetAttributes[key] === variantAttrs[key]) {
          score++;
          // Give higher priority to the attribute we're currently changing
          const changedKey = Object.keys(targetAttributes).find(k => 
            selectedAttributes[k] !== targetAttributes[k]
          );
          if (key === changedKey) {
            priorityScore += 2;
          }
        }
      });
      
      return { 
        variant, 
        score: score + priorityScore,
        exactKeyMatch: targetAttributes[Object.keys(targetAttributes).find(k => selectedAttributes[k] !== targetAttributes[k])] === 
                      variantAttrs[Object.keys(targetAttributes).find(k => selectedAttributes[k] !== targetAttributes[k])]
      };
    });
    
    // Sort by exact key match first, then by score
    scoredVariants.sort((a, b) => {
      if (a.exactKeyMatch !== b.exactKeyMatch) return a.exactKeyMatch ? -1 : 1;
      return b.score - a.score;
    });
    
    return scoredVariants[0]?.variant || null;
  };

  // Handle attribute change for all variant types
  const handleAttributeChange = (key: string, value: string) => {
    if (!productData) return;
    
    const newAttributes = { ...selectedAttributes, [key]: value };
    
    // First, try to find exact match
    let variant = findVariantByAttributes(newAttributes);
    
    if (!variant) {
      // If no exact match, find the best compatible variant
      variant = findBestCompatibleVariant(newAttributes);
      
      if (variant) {
        // Update attributes to match the compatible variant
        const compatibleAttributes = { ...selectedAttributes };
        variant.identifyingAttributes.forEach(attr => {
          compatibleAttributes[attr.key] = attr.value;
        });
        // Make sure the clicked attribute is set to what user selected
        compatibleAttributes[key] = value;
        
        setSelectedAttributes(compatibleAttributes);
        setSelectedVariant(variant);
      } else {
        // Just update the single attribute if no compatible variant found
        setSelectedAttributes(newAttributes);
        setSelectedVariant(null);
      }
    } else {
      setSelectedAttributes(newAttributes);
      setSelectedVariant(variant);
    }
  };

  // 🆕 ADDED: Tax calculation helper
  const calculateTax = (price: number) => {
    const taxRate = productData?.taxRate || 0;
    return (price * taxRate) / 100;
  };

  // 🆕 ADDED: Final price with tax
  const getFinalPrice = () => {
    const price = selectedVariant?.offerPrice || selectedVariant?.price || 
                  productData?.offerPrice || productData?.basePrice || 0;
    return price + calculateTax(price);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No product data state
  if (!productData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-gray-500 text-xl">Product not found</div>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>Home</li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            {productData.brand?.name || 'Brand'}
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            {productData.categories?.[0]?.name || 'Category'}
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{productData.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <ProductImages 
          productData={productData}
          selectedVariant={selectedVariant}
        />

        {/* Product Details */}
        <ProductInfo 
          productData={productData}
          selectedVariant={selectedVariant}
          selectedAttributes={selectedAttributes}
          onAttributeChange={handleAttributeChange}
        />
      </div>

      {/* Features Section */}
      <ProductFeatures features={productData.features} />

      {/* Dimensions Section */}
      <ProductDimensions 
        dimensions={productData.dimensions}
        weight={productData.weight}
      />

      {/* Specifications */}
      <ProductSpecifications 
        specifications={selectedVariant?.specifications}
        warranty={productData.warranty}
      />

      {/* 🆕 ADDED: Reviews Section */}
      <ProductReviewsSection 
        productId={productData._id}
        product={productData}
      />
    </div>
  );
};

export default ProductDisplay;