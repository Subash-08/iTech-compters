// In ProductDisplay.tsx - ADD variant selection from URL
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/axiosConfig';
import ProductImages from './ProductImages';
import ProductInfo from './ProductInfo';
import ProductSpecifications from './ProductSpecifications';
import ProductFeatures from './ProductFeatures';
import ProductDimensions from './ProductDimensions';
import ProductReviewsSection from '../review/ProductReviewsSection';
import LinkedProductsDisplay from './LinkedProductsDisplay';
import { ProductData, Variant } from './productTypes';
import ManufacturerImages from './ManufacturerImages';

const ProductDisplay: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
            productData = data.data?.product || data.product || data;
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
        
        // 🎯 FIXED: Handle URL variant parameter FIRST
        const urlVariantParam = searchParams.get('variant');
        
        // Handle variants with extensive validation
        if (productData.variants.length > 0) {
          const validVariants = productData.variants.filter(variant => 
            variant && 
            typeof variant === 'object'
          );          
          if (validVariants.length > 0) {
            let defaultVariant = null;
            
            // 🎯 PRIORITY 1: URL variant parameter
            if (urlVariantParam) {
              defaultVariant = validVariants.find(v => {
                // Check variant slug
                if (v.slug === urlVariantParam) {
                  return true;
                }
                // Check variant ID
                if (v._id === urlVariantParam) {
                  return true;
                }
                // Check variant name (slugified)
                if (v.name && v.name.toLowerCase().replace(/\s+/g, '-') === urlVariantParam) {
                  return true;
                }
                return false;
              });
                      }
            
            // 🎯 PRIORITY 2: Active variant with stock
            if (!defaultVariant) {
              defaultVariant = validVariants.find(v => 
                v.isActive !== false && (v.stockQuantity || 0) > 0
              );
               }
            
            // 🎯 PRIORITY 3: Any active variant
            if (!defaultVariant) {
              defaultVariant = validVariants.find(v => v.isActive !== false);
            }
            
            // 🎯 PRIORITY 4: First variant
            if (!defaultVariant) {
              defaultVariant = validVariants[0];
            }
            
            setSelectedVariant(defaultVariant);
            
            // Build attributes safely
            const defaultAttributes: Record<string, string> = {};
            if (defaultVariant?.identifyingAttributes) {
              defaultVariant.identifyingAttributes.forEach(attr => {
                if (attr && attr.key && attr.value) {
                  defaultAttributes[attr.key] = attr.value;
                }
              });
            }
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
  }, [slug, searchParams]);

  // 🎯 ADD: Effect to update URL when variant changes (two-way sync)
  useEffect(() => {
    if (selectedVariant && productData) {
      const currentVariantParam = searchParams.get('variant');
      const variantSlug = selectedVariant.slug || selectedVariant.name?.toLowerCase().replace(/\s+/g, '-');
      
      // Only update URL if it's different from current selection
      if (variantSlug && currentVariantParam !== variantSlug) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('variant', variantSlug);
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [selectedVariant, productData, searchParams, setSearchParams]);

  // 🆕 FIX: Get the correct specifications based on product variant configuration
  const getDisplaySpecifications = () => {
    if (!productData) return [];

    // If product has variants and a variant is selected, use variant specifications
    if (productData.variantConfiguration?.hasVariants && selectedVariant) {
      return selectedVariant.specifications || [];
    }
    return productData.specifications || [];
  };

  // Find variant based on selected attributes
  const findVariantByAttributes = (attributes: Record<string, string>): Variant | null => {
    if (!productData || !productData.variants) return null;
    
    return productData.variants.find(variant => 
      variant.identifyingAttributes?.every(attr => 
        attributes[attr.key] === attr.value
      )
    ) || null;
  };

  // Handle attribute change for all variant types
  const handleAttributeChange = (key: string, value: string) => {
    if (!productData) return;
    
    const newAttributes = { ...selectedAttributes, [key]: value };
    
    // First, try to find exact match
    let variant = findVariantByAttributes(newAttributes);
    
    if (!variant) {
      // Just update the single attribute if no compatible variant found
      setSelectedAttributes(newAttributes);
      setSelectedVariant(null);
    } else {
      setSelectedAttributes(newAttributes);
      setSelectedVariant(variant);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading product...</span>
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
  const displaySpecifications = getDisplaySpecifications();
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
            {selectedVariant && (
              <span className="text-gray-900 font-medium"> - {selectedVariant.name}</span>
            )}
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

      <ManufacturerImages productData={productData} />

      {/* 🆕 FIX: Pass the correct specifications */}
      <ProductSpecifications 
        specifications={displaySpecifications}
        warranty={productData.warranty}
      />

      {/* Reviews Section */}
      <ProductReviewsSection 
        productId={productData._id}
        product={productData}
      />

      {/* 🆕 Linked Products Section */}
      <LinkedProductsDisplay 
        productId={productData._id}
        currentProductSlug={productData.slug}
        title="You Might Also Like"
        maxProducts={4}
      />
    </div>
  );
};

export default ProductDisplay;