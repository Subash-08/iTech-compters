// In ProductDisplay.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Home, AlertCircle, RefreshCw } from 'lucide-react'; 
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
  console.log(productData);
  
  // -- LOGIC SECTION (Unchanged) --
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
        
        const urlVariantParam = searchParams.get('variant');
        
        if (productData.variants.length > 0) {
          const validVariants = productData.variants.filter(variant => 
            variant && typeof variant === 'object'
          );           
          if (validVariants.length > 0) {
            let defaultVariant = null;
            
            if (urlVariantParam) {
              defaultVariant = validVariants.find(v => {
                if (v.slug === urlVariantParam) return true;
                if (v._id === urlVariantParam) return true;
                if (v.name && v.name.toLowerCase().replace(/\s+/g, '-') === urlVariantParam) return true;
                return false;
              });
            }
            
            if (!defaultVariant) {
              defaultVariant = validVariants.find(v => 
                v.isActive !== false && (v.stockQuantity || 0) > 0
              );
            }
            
            if (!defaultVariant) {
              defaultVariant = validVariants.find(v => v.isActive !== false);
            }
            
            if (!defaultVariant) {
              defaultVariant = validVariants[0];
            }
            
            setSelectedVariant(defaultVariant);
            
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

  useEffect(() => {
    if (selectedVariant && productData) {
      const currentVariantParam = searchParams.get('variant');
      const variantSlug = selectedVariant.slug || selectedVariant.name?.toLowerCase().replace(/\s+/g, '-');
      
      if (variantSlug && currentVariantParam !== variantSlug) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('variant', variantSlug);
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [selectedVariant, productData, searchParams, setSearchParams]);

  const getDisplaySpecifications = () => {
    if (!productData) return [];
    if (productData.variantConfiguration?.hasVariants && selectedVariant) {
      return selectedVariant.specifications || [];
    }
    return productData.specifications || [];
  };

  const findVariantByAttributes = (attributes: Record<string, string>): Variant | null => {
    if (!productData || !productData.variants) return null;
    return productData.variants.find(variant => 
      variant.identifyingAttributes?.every(attr => 
        attributes[attr.key] === attr.value
      )
    ) || null;
  };

  const handleAttributeChange = (key: string, value: string) => {
    if (!productData) return;
    const newAttributes = { ...selectedAttributes, [key]: value };
    let variant = findVariantByAttributes(newAttributes);
    if (!variant) {
      setSelectedAttributes(newAttributes);
      setSelectedVariant(null);
    } else {
      setSelectedAttributes(newAttributes);
      setSelectedVariant(variant);
    }
  };
  // -- END LOGIC SECTION --

  // -- RENDER SECTION --

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-gray-200 animate-spin"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-blue-600 animate-spin opacity-70"></div>
        </div>
        <span className="mt-4 text-sm font-medium text-gray-400 tracking-wide uppercase">Loading Product...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Product not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const displaySpecifications = getDisplaySpecifications();

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in font-sans">
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-md bg-white/90">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center h-12 text-sm text-gray-500 overflow-x-auto no-scrollbar" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 whitespace-nowrap">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors p-1">
                  <Home className="w-4 h-4" />
                </button>
              </li>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <li className="hover:text-gray-900 transition-colors cursor-pointer">
                {productData.brand?.name || 'Brand'}
              </li>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <li className="hover:text-gray-900 transition-colors cursor-pointer">
                {productData.categories?.[0]?.name || 'Category'}
              </li>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <li className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                {productData.name}
                {selectedVariant && (
                  <span className="text-gray-500 font-normal ml-1"> - {selectedVariant.name}</span>
                )}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-12">
          
          {/* Left Column: Images (Reduced Width - 5 Cols) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="sticky top-24 transition-all duration-500 ease-out">
              <ProductImages 
                productData={productData}
                selectedVariant={selectedVariant}
              />
            </div>
          </div>

          {/* Right Column: Details & Buy Box (Increased Width - 7 Cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
             <ProductInfo 
                productData={productData}
                selectedVariant={selectedVariant}
                selectedAttributes={selectedAttributes}
                onAttributeChange={handleAttributeChange}
              />
          </div>
        </div>

        <div className="border-t border-gray-200 my-12" />

        {/* Content Sections: Stacked Full Width */}
        <div className="space-y-16 max-w-none w-full">
            
            {/* 1. Features */}
            <section className="scroll-mt-24 w-full" id="features">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight border-l-4 border-blue-600 pl-4">Product Highlights</h2>
              <ProductFeatures features={productData.features} />
            </section>

            {/* 2. Specs & Dimensions Grid */}
            <section className="scroll-mt-24 w-full" id="specs">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="w-full">
                     <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight border-l-4 border-blue-600 pl-4">Technical Specifications</h2>
                     <ProductSpecifications 
                       specifications={displaySpecifications}
                       warranty={productData.warranty}
                     />
                   </div>
                   

                     <div className="w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-l-4 border-gray-300 pl-4">Dimensions & Weight</h3>
                        <ProductDimensions 
                          dimensions={productData.dimensions}
                          weight={productData.weight}
                        />
                     </div>

                </div>
            </section>
            
             {/* 3. Manufacturer Content */}
            <div className="w-full">
               <ManufacturerImages productData={productData} />
            </div>

            {/* 4. Reviews */}
            <section className="scroll-mt-8 w-full" id="reviews">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight border-l-4 border-blue-600 pl-4">Customer Reviews</h2>
              <ProductReviewsSection 
                productId={productData._id}
                product={productData}
              />
            </section>
            
            {/* 5. Linked Products (Moved to bottom, full width) */}
            <section className="w-full border-t border-gray-200">
                <LinkedProductsDisplay 
                  productId={productData._id}
                  currentProductSlug={productData.slug}
                  title="You Might Also Like"
                  maxProducts={5}
                />
            </section>
        </div>

      </main>
    </div>
  );
};

export default ProductDisplay;