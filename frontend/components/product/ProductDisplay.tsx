import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Types - UPDATED with missing fields from schema
interface Image {
  url: string;
  altText: string;
}

interface VariantSpec {
  key: string;
  value: string;
}

interface SpecificationSection {
  sectionTitle: string;
  specs: VariantSpec[];
}

interface Feature {
  title: string;
  description: string;
}

interface Review {
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: string;
}

interface Weight {
  value?: number;
  unit: string;
}

interface Meta {
  title?: string;
  description?: string;
  keywords?: string[];
}

interface IdentifyingAttribute {
  key: string;
  label: string;
  value: string;
  displayValue: string;
  hexCode?: string;
  isColor?: boolean;
  _id: string;
}

interface VariantImages {
  thumbnail?: Image;
  gallery: Image[];
}

interface Variant {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  offerPrice: number;
  stockQuantity: number;
  identifyingAttributes: IdentifyingAttribute[];
  images: VariantImages;
  isActive: boolean;
  specifications: SpecificationSection[];
}

interface VariantOption {
  label: string;
  values: string[];
}

// 🆕 UPDATED: Added all missing fields from schema
interface ProductData {
  _id: string;
  name: string;
  brand: {
    _id: string;
    name: string;
    slug: string;
  };
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  tags: string[];
  condition: string;
  label?: string; // 🆕 ADDED
  isActive: boolean;
  status: string;
  description?: string; // 🆕 ADDED
  definition?: string; // 🆕 ADDED
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  taxRate?: number; // 🆕 ADDED
  stockQuantity: number;
  variants: Variant[];
  averageRating: number;
  totalReviews: number;
  slug: string;
  createdAt: string;
  totalStock: number;
  lowestPrice: number;
  availableColors: Array<{
    value: string;
    displayValue: string;
    hexCode: string;
    stock: number;
    variants: string[];
  }>;
  images: {
    thumbnail: Image;
    hoverImage: Image;
    gallery: Image[];
  };
  variantConfiguration: {
    hasVariants: boolean;
    variantType: string;
    variantCreatingSpecs: Array<{
      sectionTitle: string;
      specKey: string;
      specLabel: string;
      possibleValues: string[];
      _id: string;
    }>;
    variantAttributes: Array<{
      key: string;
      label: string;
      values: string[];
    }>;
  };
  // 🆕 ADDED missing fields from schema
  specifications?: SpecificationSection[];
  features?: Feature[];
  dimensions?: Dimensions;
  weight?: Weight;
  warranty?: string;
  reviews?: Review[];
  meta?: Meta;
  canonicalUrl?: string;
  linkedProducts?: string[];
  notes?: string;
  id: string;
}

const ProductDisplay: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!slug) {
          setError('Product identifier is missing');
          setLoading(false);
          return;
        }

        console.log('Fetching product with slug:', slug);

        const endpoints = [
          `${import.meta.env.VITE_API_URL || "https://itech-compters.onrender.com"}/api/v1/products/slug/${slug}`,
          `${import.meta.env.VITE_API_URL || "https://itech-compters.onrender.com"}/api/v1/products/${slug}`
        ];

        let productData: ProductData | null = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log('Trying endpoint:', endpoint);
            const res = await fetch(endpoint);
            
            if (res.ok) {
              const data = await res.json();
              productData = data.product || data;
              console.log('✅ Successfully fetched from:', endpoint);
              console.log('Product data structure:', productData);
              break;
            } else {
              console.log('❌ Endpoint failed:', endpoint, 'Status:', res.status);
              lastError = `HTTP ${res.status}: ${res.statusText}`;
            }
          } catch (err) {
            console.log('❌ Endpoint error:', endpoint, err);
            lastError = err;
            continue;
          }
        }

        if (!productData) {
          throw new Error(`Product not found. ${lastError ? `Last error: ${lastError}` : ''}`);
        }
        
        // 🆕 EXTENSIVE VALIDATION
        console.log('=== VALIDATING PRODUCT DATA ===');
        console.log('Has variants property:', 'variants' in productData);
        console.log('Variants is array:', Array.isArray(productData.variants));
        console.log('Variants count:', productData.variants?.length || 0);
        
        if (!productData.variants || !Array.isArray(productData.variants)) {
          console.log('⚠️ No variants array found, initializing empty array');
          productData.variants = [];
        }
        
        setProductData(productData);
        
        // Handle variants with extensive validation
        if (productData.variants.length > 0) {
          console.log('Processing variants...');
          
          // Filter out any invalid variants
          const validVariants = productData.variants.filter(variant => 
            variant && 
            typeof variant === 'object' && 
            variant.identifyingAttributes &&
            Array.isArray(variant.identifyingAttributes)
          );
          
          if (validVariants.length > 0) {
            const defaultVariant = validVariants.find(v => v.isActive) || validVariants[0];
            console.log('Selected default variant:', defaultVariant);
            
            setSelectedVariant(defaultVariant);
            
            // Build attributes safely
            const defaultAttributes: Record<string, string> = {};
            defaultVariant.identifyingAttributes.forEach(attr => {
              if (attr && attr.key && attr.value) {
                defaultAttributes[attr.key] = attr.value;
              }
            });
            setSelectedAttributes(defaultAttributes);
            
            // Set main image with fallbacks
            const variantImages = defaultVariant.images || {};
            const firstVariantImage = (variantImages.gallery && variantImages.gallery[0]?.url) || 
                                     variantImages.thumbnail?.url;
            const productThumbnail = productData.images?.thumbnail?.url;
            setMainImage(firstVariantImage || productThumbnail || '/placeholder-image.jpg');
            
          } else {
            console.log('⚠️ No valid variants found');
            setSelectedVariant(null);
            setMainImage(productData.images?.thumbnail?.url || '/placeholder-image.jpg');
          }
        } else {
          console.log('ℹ️ Product has no variants');
          setSelectedVariant(null);
          setMainImage(productData.images?.thumbnail?.url || '/placeholder-image.jpg');
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

  // Get available colors with stock info
  const getAvailableColors = () => {
    if (!productData?.variants) return [];
    
    const colorMap = new Map();
    
    productData.variants.forEach(variant => {
      if (!variant.isActive) return;
      
      // Look for color attribute - check both key and potential isColor flag
      const colorAttr = variant.identifyingAttributes.find(attr => 
        attr.key === 'color' || attr.isColor
      );
      
      if (colorAttr) {
        const existing = colorMap.get(colorAttr.value) || {
          value: colorAttr.value,
          displayValue: colorAttr.displayValue || colorAttr.value,
          hexCode: colorAttr.hexCode || getColorHexCode(colorAttr.value),
          stock: 0,
          inStock: false,
          variantCount: 0
        };
        
        existing.stock += variant.stockQuantity || 0;
        existing.variantCount += 1;
        existing.inStock = existing.stock > 0;
        colorMap.set(colorAttr.value, existing);
      }
    });
    
    return Array.from(colorMap.values());
  };

  // Get display value for any variant type
  const getDisplayValue = (specKey: string, value: string) => {
    if (!productData?.variants) return value;
    
    const variant = productData.variants.find(v => 
      v.identifyingAttributes.some(attr => attr.key === specKey && attr.value === value)
    );
    
    const attr = variant?.identifyingAttributes.find(attr => attr.key === specKey);
    return attr?.displayValue || value;
  };

  // Find variant based on selected attributes
  const findVariantByAttributes = (attributes: Record<string, string>): Variant | null => {
    if (!productData || !productData.variants) return null;
    
    return productData.variants.find(variant => 
      variant.identifyingAttributes.every(attr => 
        attributes[attr.key] === attr.value
      )
    ) || null;
  };

  // Check if an option is compatible with current selections
  const isOptionCompatible = (specKey: string, value: string): boolean => {
    const testAttributes = { ...selectedAttributes, [specKey]: value };
    return findBestCompatibleVariant(testAttributes) !== null;
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

  // Enhanced getAvailableOptions that considers current selections
  const getAvailableOptions = (specKey: string) => {
    if (!productData?.variants) return [];
    
    const optionMap = new Map();
    const otherSelectedAttributes = { ...selectedAttributes };
    delete otherSelectedAttributes[specKey];
    
    productData.variants.forEach(variant => {
      if (!variant.isActive) return;
      
      const attr = variant.identifyingAttributes.find(attr => attr.key === specKey);
      
      if (attr) {
        // Check if this variant is compatible with other selected attributes
        const isCompatible = Object.keys(otherSelectedAttributes).every(key => {
          if (!otherSelectedAttributes[key]) return true; // No selection for this key
          const variantAttr = variant.identifyingAttributes.find(a => a.key === key);
          return variantAttr && variantAttr.value === otherSelectedAttributes[key];
        });
        
        const existing = optionMap.get(attr.value) || {
          value: attr.value,
          displayValue: attr.displayValue || attr.value,
          stock: 0,
          inStock: false,
          variantCount: 0,
          isCompatible: true // Start as true, will be false if no compatible variants
        };
        
        existing.stock += variant.stockQuantity || 0;
        existing.variantCount += 1;
        existing.inStock = existing.stock > 0;
        // Only mark as compatible if at least one variant with this option is compatible
        if (!existing.hasOwnProperty('isCompatible')) {
          existing.isCompatible = isCompatible;
        } else {
          existing.isCompatible = existing.isCompatible || isCompatible;
        }
        optionMap.set(attr.value, existing);
      }
    });
    
    return Array.from(optionMap.values());
  };

  // Handle attribute change for all variant types
  const handleAttributeChange = (key: string, value: string) => {
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
    
    // Update gallery with variant-specific images if variant found
    if (variant) {
      const firstVariantImage = variant.images?.gallery?.[0]?.url || 
                               variant.images?.thumbnail?.url;
      setMainImage(firstVariantImage || productData?.images?.thumbnail?.url || '');
      setImageError(false);
    }
  };

  // Render all variant selectors dynamically
  const renderVariantSelectors = () => {
    if (!productData?.variantConfiguration?.hasVariants) return null;

    return (
      <>
        {/* Dynamic Variant Selectors for ALL variantCreatingSpecs */}
        {productData.variantConfiguration.variantCreatingSpecs?.map((spec) => {
          const availableOptions = getAvailableOptions(spec.specKey);
          
          return (
            <div key={spec.specKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {spec.specLabel}:
                  {selectedAttributes[spec.specKey] && (
                    <span className="ml-2 text-gray-600 font-normal">
                      {getDisplayValue(spec.specKey, selectedAttributes[spec.specKey])}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-3">
                  {spec.possibleValues?.map((value) => {
                    const isSelected = selectedAttributes[spec.specKey] === value;
                    const optionInfo = availableOptions.find(opt => opt.value === value);
                    // Use compatibility check instead of simple availability
                    const isCompatible = isOptionCompatible(spec.specKey, value);
                    const stockInfo = optionInfo?.stock ?? 0;

                    return (
                      <button
                        key={value}
                        onClick={() => handleAttributeChange(spec.specKey, value)}
                        disabled={!isCompatible}
                        className={`
                          relative px-4 py-2 border rounded-lg text-sm font-medium transition-colors
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                            : isCompatible
                            ? 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                            : 'border-gray-200 text-gray-400 bg-gray-100'
                          }
                          ${!isCompatible ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={!isCompatible ? 'Not available with current selection' : `${getDisplayValue(spec.specKey, value)}${stockInfo > 0 ? ` (${stockInfo} available)` : ''}`}
                      >
                        {getDisplayValue(spec.specKey, value)}
                        
                        {/* Low Stock Badge */}
                        {isCompatible && stockInfo > 0 && stockInfo < 5 && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">
                            Low
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Stock information */}
                {selectedAttributes[spec.specKey] && (
                  <div className="mt-2 text-sm">
                    {isOptionCompatible(spec.specKey, selectedAttributes[spec.specKey]) ? (
                      <span className="text-green-600 font-medium">
                        ✓ In Stock ({availableOptions.find(opt => opt.value === selectedAttributes[spec.specKey])?.stock || 0} available)
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Not available with current selection</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Color Selector for variantAttributes */}
        {productData.variantConfiguration.variantAttributes?.map((attribute) => {
          const isColorAttr = attribute.isColorAttribute || attribute.key === 'color';
          
          if (isColorAttr) {
            const availableColors = getAvailableColors();
            
            return (
              <div key={attribute.key} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {attribute.label}:
                    {selectedAttributes[attribute.key] && (
                      <span className="ml-2 text-gray-600 font-normal">
                        {availableColors.find(c => c.value === selectedAttributes[attribute.key])?.displayValue}
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {attribute.values.map((colorValue) => {
                      const colorName = typeof colorValue === 'string' ? colorValue : colorValue.value;
                      const displayName = typeof colorValue === 'string' ? colorValue : (colorValue.displayValue || colorValue.value);
                      const hexCode = typeof colorValue === 'string' ? getColorHexCode(colorValue) : (colorValue.hexCode || getColorHexCode(colorValue.value));
                      
                      const colorInfo = availableColors.find(c => c.value === colorName);
                      const isSelected = selectedAttributes[attribute.key] === colorName;
                      // Use compatibility check instead of simple availability
                      const isCompatible = isOptionCompatible(attribute.key, colorName);
                      const stockInfo = colorInfo?.stock ?? 0;

                      return (
                        <button
                          key={colorName}
                          onClick={() => handleAttributeChange(attribute.key, colorName)}
                          disabled={!isCompatible}
                          className={`
                            relative flex flex-col items-center p-2 border-2 rounded-lg transition-all
                            ${isSelected 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : isCompatible
                              ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                              : 'border-gray-200 bg-gray-100'
                            }
                            ${!isCompatible ? 'cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          title={`${displayName}${!isCompatible ? ' - Not available with current selection' : stockInfo > 0 ? ` (${stockInfo} available)` : ''}`}
                        >
                          {/* Color Swatch */}
                          <div 
                            className="w-12 h-12 rounded-lg border border-gray-300 mb-1 shadow-sm"
                            style={{ backgroundColor: hexCode }}
                          />
                          
                          {/* Color Name */}
                          <span className={`text-xs max-w-16 truncate ${
                            isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                          }`}>
                            {displayName}
                          </span>
                          
                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Low Stock Badge */}
                          {isCompatible && stockInfo > 0 && stockInfo < 5 && !isSelected && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded">
                              Low
                            </span>
                          )}
                          
                          {/* Compatibility Overlay */}
                          {!isCompatible && (
                            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-500 font-medium rotate-45">X</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Stock information */}
                  {selectedAttributes[attribute.key] && (
                    <div className="mt-2 text-sm">
                      {isOptionCompatible(attribute.key, selectedAttributes[attribute.key]) ? (
                        <span className="text-green-600 font-medium">
                          ✓ In Stock ({availableColors.find(c => c.value === selectedAttributes[attribute.key])?.stock || 0} available)
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Not available with current selection</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          
          return null;
        })}
      </>
    );
  };

  // Add this helper function for color hex codes
  const getColorHexCode = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'silver': '#C0C0C0',
      'gray': '#808080',
      'space black': '#333333',
      'space gray': '#535353',
      'blue': '#007AFF',
      'red': '#FF3B30',
      'green': '#34C759',
      'yellow': '#FFCC00',
      'pink': '#FF2D55',
      'purple': '#AF52DE',
      'gold': '#FFD700',
      'midnight': '#171717',
      'starlight': '#F8F9FA',
      'space blue': '#1E3A5F'
    };
    
    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
  };

  // Get current price and stock info
  const getCurrentPriceInfo = () => {
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        offerPrice: selectedVariant.offerPrice,
        stockQuantity: selectedVariant.stockQuantity
      };
    }
    
    // For products without variants
    return {
      price: productData?.basePrice || 0,
      offerPrice: productData?.offerPrice || 0,
      stockQuantity: productData?.stockQuantity || 0
    };
  };

  const currentPriceInfo = getCurrentPriceInfo();
  const availableColors = getAvailableColors();

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setMainImage('/placeholder-image.jpg');
  };

  // 🆕 ADDED: Render product features
  const renderFeatures = () => {
    if (!productData?.features || productData.features.length === 0) return null;

    return (
      <div className="mt-8 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {productData.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">{feature.title}</h3>
                {feature.description && (
                  <p className="text-gray-600 text-sm mt-1">{feature.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 🆕 ADDED: Render dimensions and weight
  const renderDimensions = () => {
    if (!productData?.dimensions && !productData?.weight) return null;

    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {productData.dimensions && (
            <div>
              <span className="text-gray-600">Dimensions: </span>
              <span className="font-medium">
                {productData.dimensions.length} × {productData.dimensions.width} × {productData.dimensions.height} {productData.dimensions.unit}
              </span>
            </div>
          )}
          {productData.weight && (
            <div>
              <span className="text-gray-600">Weight: </span>
              <span className="font-medium">
                {productData.weight.value} {productData.weight.unit}
              </span>
            </div>
          )}
        </div>
      </div>
    );
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
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-96">
            {!imageError && mainImage ? (
              <img
                src={mainImage}
                alt={selectedVariant?.images.gallery[0]?.altText || productData.images?.thumbnail?.altText || productData.name}
                className="max-h-full max-w-full object-contain"
                onError={handleImageError}
              />
            ) : (
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">📷</div>
                <div>Image not available</div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex space-x-2 overflow-x-auto">
            {/* Variant gallery images */}
            {selectedVariant?.images?.gallery?.map((image, index) => (
              <button
                key={index}
                className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                  mainImage === image.url ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setMainImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.altText}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-thumbnail.jpg';
                  }}
                />
              </button>
            ))}
            
            {/* Variant thumbnail */}
            {selectedVariant?.images?.thumbnail && (
              <button
                key="variant-thumbnail"
                className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                  mainImage === selectedVariant.images.thumbnail.url ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setMainImage(selectedVariant.images.thumbnail!.url)}
              >
                <img
                  src={selectedVariant.images.thumbnail.url}
                  alt={selectedVariant.images.thumbnail.altText}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-thumbnail.jpg';
                  }}
                />
              </button>
            )}
            
            {/* Product base gallery images */}
            {productData.images?.gallery?.map((image, index) => (
              <button
                key={`gallery-${index}`}
                className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                  mainImage === image.url ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setMainImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.altText}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-thumbnail.jpg';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Product Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{productData.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {productData.brand && (
                <>
                  <span>Brand: {productData.brand.name}</span>
                  <span>•</span>
                </>
              )}
              <span>Condition: {productData.condition}</span>
              {productData.label && (
                <>
                  <span>•</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {productData.label}
                  </span>
                </>
              )}
              <span>•</span>
              <span>SKU: {selectedVariant?.sku || productData.sku}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(productData.averageRating || 0)).padEnd(5, '☆')}
            </div>
            <span className="text-sm text-gray-600">
              {productData.totalReviews === 0 
                ? 'No reviews yet' 
                : `${productData.averageRating || 0} out of 5 (${productData.totalReviews} reviews)`
              }
            </span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900">
                ${currentPriceInfo.offerPrice || currentPriceInfo.price}
              </span>
              {currentPriceInfo.offerPrice < currentPriceInfo.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${currentPriceInfo.price}
                  </span>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                    Save ${(currentPriceInfo.price - currentPriceInfo.offerPrice).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            {productData.discountPercentage > 0 && (
              <div className="text-sm text-green-600 font-medium">
                {productData.discountPercentage}% OFF
              </div>
            )}
            <div className="text-sm text-gray-600">
              Inclusive of all taxes
              {productData.taxRate && productData.taxRate > 0 && (
                <span> (incl. ${calculateTax(currentPriceInfo.offerPrice || currentPriceInfo.price).toFixed(2)} tax)</span>
              )}
            </div>
          </div>

          {/* 🚀 DYNAMIC VARIANT SELECTORS - ALL IN ONE PLACE */}
          {renderVariantSelectors()}

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {currentPriceInfo.stockQuantity > 0 ? (
              <>
                <span className="text-green-600 text-sm font-medium">In Stock</span>
                <span className="text-gray-500 text-sm">
                  ({currentPriceInfo.stockQuantity} available)
                </span>
              </>
            ) : (
              <span className="text-red-600 text-sm font-medium">Out of Stock</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                currentPriceInfo.stockQuantity === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
              }`}
              disabled={currentPriceInfo.stockQuantity === 0}
            >
              {currentPriceInfo.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                currentPriceInfo.stockQuantity === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
              disabled={currentPriceInfo.stockQuantity === 0}
            >
              Buy Now
            </button>
          </div>

          {/* Delivery Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-medium">2-4 business days</span>
              </div>
              <div className="flex justify-between">
                <span>Returns</span>
                <span className="font-medium">30 days return policy</span>
              </div>
              <div className="flex justify-between">
                <span>Warranty</span>
                <span className="font-medium">{productData.warranty || '1 year manufacturer warranty'}</span>
              </div>
            </div>
          </div>

          {/* 🆕 ADDED: Description */}
          {productData.description && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{productData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 🆕 ADDED: Features Section */}
      {renderFeatures()}

      {/* 🆕 ADDED: Dimensions Section */}
      {renderDimensions()}

      {/* Specifications */}
      {(selectedVariant?.specifications && selectedVariant.specifications.length > 0) && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Specifications</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {selectedVariant.specifications.map((section, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-4 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="md:col-span-1 px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                  {section.sectionTitle}
                </div>
                <div className="md:col-span-3 px-6 py-4">
                  <div className="space-y-2">
                    {section.specs.map((spec, specIndex) => (
                      <div key={specIndex} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {spec.key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-gray-900 font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;