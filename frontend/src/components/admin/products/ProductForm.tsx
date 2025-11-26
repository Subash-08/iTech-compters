// Update your ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { ProductFormData, Brand, Category } from '../types/product';
import BasicInfoSection from './sections/BasicInfoSection';
import PricingInventorySection from './sections/PricingInventorySection';
import ImagesSection from './sections/ImagesSection';
import VariantsSection from './sections/VariantsSection';
import SpecificationsSection from './sections/SpecificationsSection';
import FeaturesSection from './sections/FeaturesSection';
import DimensionsWeightSection from './sections/DimensionsWeightSection';
import SeoSection from './sections/SeoSection';
import LinkedProductsSection from './LinkedProductsSection'; // 🆕 Add this import
import api from '../../config/axiosConfig';
import { toast } from 'react-toastify';

const initialProductData: ProductFormData = {
  name: '',
  brand: '',
  categories: [],
  tags: [],
  condition: 'New',
  label: '',
  isActive: true,
  status: 'Draft',
  description: '',
  definition: '',
  
  // 🆕 NEW FIELDS
  hsn: '', // Add HSN field
  mrp: 0, // Add MRP field
  manufacturerImages: [], // Add manufacturerImages array
  
  images: {
    thumbnail: { url: '', altText: '' },
    gallery: []
  },
  
  basePrice: 0,
  offerPrice: 0,
  discountPercentage: 0,
  taxRate: 0,
  sku: '',
  barcode: '',
  stockQuantity: 0,
  
  variantConfiguration: {
    hasVariants: false,
    variantType: 'None',
    variantCreatingSpecs: [],
    variantAttributes: []
  },
  variants: [],
  
  specifications: [],
  features: [],
  
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
    unit: 'cm'
  },
  weight: {
    value: 0,
    unit: 'kg'
  },
  
  warranty: '',
  meta: {
    title: '',
    description: '',
    keywords: []
  },
  canonicalUrl: '',
  linkedProducts: [],
  notes: ''
};

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { _id?: string }; // 🆕 Add _id for current product
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  initialData, 
  onSubmit,
  onCancel,
  loading = false 
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialProductData);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSection, setActiveSection] = useState('basic');
  const [isInitialized, setIsInitialized] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🆕 Get current product ID for edit mode
  const currentProductId = initialData?._id;
  // 🆕 Toast error handler using react-toastify
  const showErrorToast = (error: any) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    toast.error(errorMessage);
    console.error('Product Form Error:', error);
  };

// Initialize form data when initialData changes
useEffect(() => {
  if (initialData && !isInitialized) {
    const mergedData = {
      ...initialProductData,
      ...initialData,
      // 🆕 Handle new fields
      hsn: initialData.hsn || initialProductData.hsn,
      mrp: initialData.mrp || initialProductData.mrp,
      manufacturerImages: Array.isArray(initialData.manufacturerImages) && initialData.manufacturerImages.length > 0 
        ? initialData.manufacturerImages 
        : initialProductData.manufacturerImages,
      images: {
        ...initialProductData.images,
        ...(initialData.images || {}),
        thumbnail: {
          url: initialData.images?.thumbnail?.url || initialProductData.images.thumbnail.url,
          altText: initialData.images?.thumbnail?.altText || initialProductData.images.thumbnail.altText
        }
      },
      variantConfiguration: {
        ...initialProductData.variantConfiguration,
        ...(initialData.variantConfiguration || {})
      },
      dimensions: {
        ...initialProductData.dimensions,
        ...(initialData.dimensions || {})
      },
      weight: {
        ...initialProductData.weight,
        ...(initialData.weight || {})
      },
      meta: {
        ...initialProductData.meta,
        ...(initialData.meta || {})
      },
      description: initialData.description && initialData.description !== "" ? initialData.description : initialProductData.description,
      definition: initialData.definition && initialData.definition !== "" ? initialData.definition : initialProductData.definition,
      label: initialData.label && initialData.label !== "" ? initialData.label : initialProductData.label,
      sku: initialData.sku && initialData.sku !== "" ? initialData.sku : initialProductData.sku,
      barcode: initialData.barcode && initialData.barcode !== "" ? initialData.barcode : initialProductData.barcode,
      warranty: initialData.warranty && initialData.warranty !== "" ? initialData.warranty : initialProductData.warranty,
      canonicalUrl: initialData.canonicalUrl && initialData.canonicalUrl !== "" ? initialData.canonicalUrl : initialProductData.canonicalUrl,
      notes: initialData.notes && initialData.notes !== "" ? initialData.notes : initialProductData.notes,
      tags: Array.isArray(initialData.tags) && initialData.tags.length > 0 ? initialData.tags : initialProductData.tags,
      specifications: Array.isArray(initialData.specifications) && initialData.specifications.length > 0 ? initialData.specifications : initialProductData.specifications,
      features: Array.isArray(initialData.features) && initialData.features.length > 0 ? initialData.features : initialProductData.features,
      linkedProducts: Array.isArray(initialData.linkedProducts) && initialData.linkedProducts.length > 0 ? initialData.linkedProducts : initialProductData.linkedProducts,
      variants: Array.isArray(initialData.variants) && initialData.variants.length > 0 ? initialData.variants : initialProductData.variants
    };
    
    setFormData(mergedData);
    setIsInitialized(true);
  } else if (!initialData && !isInitialized) {
    setFormData(initialProductData);
    setIsInitialized(true);
  }
}, [initialData, isInitialized]);
  // Reset form when switching between products
  useEffect(() => {
    if (initialData) {
      const mergedData = {
        ...initialProductData,
        ...initialData,
        images: {
          ...initialProductData.images,
          ...initialData.images
        },
        variantConfiguration: {
          ...initialProductData.variantConfiguration,
          ...initialData.variantConfiguration
        },
        dimensions: {
          ...initialProductData.dimensions,
          ...initialData.dimensions
        },
        weight: {
          ...initialProductData.weight,
          ...initialData.weight
        },
        meta: {
          ...initialProductData.meta,
          ...initialData.meta
        }
      };
      setFormData(mergedData);
    }
  }, [initialData]);

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        api.get('/brands'),
        api.get('/admin/categories')
      ]);

      const brandsData = brandsResponse.data;
      const categoriesData = categoriesResponse.data;

      const brands = Array.isArray(brandsData) 
        ? brandsData 
        : (brandsData.brands || brandsData.data || []);

      const categories = Array.isArray(categoriesData)
        ? categoriesData
        : (categoriesData.categories || categoriesData.data || []);

      setBrands(brands);
      setCategories(categories);

    } catch (error) {
      console.error('Error fetching brands and categories:', error);
      showErrorToast(error); // 🆕 Show toast for fetch errors
      setBrands([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchBrandsAndCategories();
  }, []);

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      return newData;
    });
  };

// 🆕 Enhanced handleSubmit with error handling
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitLoading(true);
  
  try {
    // Enhanced validation
    const errors = [];
    if (!formData.name?.trim()) errors.push('Product name is required');
    if (!formData.description?.trim()) errors.push('Product description is required');
    if (!formData.brand) errors.push('Brand is required');
    if (!formData.categories.length) errors.push('At least one category is required');
    
    // 🆕 FIX: Only validate base price if product doesn't have variants
    const hasActiveVariants = formData.variantConfiguration.hasVariants && formData.variants.length > 0;
    
    if (!hasActiveVariants) {
      // Only require base price if no variants exist
      if (!formData.basePrice || formData.basePrice <= 0) {
        errors.push('Valid base price is required');
      }
    } else {
      // 🆕 Validate that variants have proper pricing
      const variantsWithInvalidPrice = formData.variants.filter(
        variant => !variant.price || variant.price <= 0
      );
      
      if (variantsWithInvalidPrice.length > 0) {
        errors.push(`${variantsWithInvalidPrice.length} variant(s) have invalid pricing. All variants must have a valid price.`);
      }
      
      // 🆕 Validate that variants have names
      const variantsWithoutName = formData.variants.filter(
        variant => !variant.name?.trim()
      );
      
      if (variantsWithoutName.length > 0) {
        errors.push(`${variantsWithoutName.length} variant(s) are missing names. All variants must have a name.`);
      }
    }
    
    if (!formData.images?.thumbnail?.url) errors.push('Thumbnail image is required');

    if (errors.length > 0) {
      // 🆕 Show validation errors as toast
      errors.forEach(error => toast.error(error));
      setSubmitLoading(false);
      return;
    }
    
    // 🆕 FIX: Clean up data before sending to backend
    const finalFormData = cleanFormData(formData);
    
    // Ensure variant stock is calculated correctly
    if (hasActiveVariants) {
      finalFormData.stockQuantity = formData.variants.reduce(
        (total, variant) => total + (variant.stockQuantity || 0), 0
      );
    }
    
    console.log('Final data being submitted:', finalFormData); // 🆕 Debug log
    
    // 🆕 Call onSubmit and handle potential errors
    await onSubmit(finalFormData);
    
    // 🆕 Show success toast
    toast.success(
      initialData ? 'Product updated successfully!' : 'Product created successfully!'
    );
    
  } catch (error) {
    // 🆕 Handle submission errors
    showErrorToast(error);
  } finally {
    setSubmitLoading(false);
  }
};

// 🆕 ADD: Function to clean form data before submission
const cleanFormData = (data: ProductFormData): ProductFormData => {
  const cleaned = { ...data };
  
  // 🆕 Clean gallery images - remove empty images
  if (cleaned.images?.gallery) {
    cleaned.images.gallery = cleaned.images.gallery.filter(
      (image: any) => image.url && image.url.trim() !== '' && image.altText && image.altText.trim() !== ''
    );
  }
  
  // 🆕 Clean manufacturer images - remove empty images
  if (cleaned.manufacturerImages) {
    cleaned.manufacturerImages = cleaned.manufacturerImages.filter(
      (image: any) => image.url && image.url.trim() !== '' && image.altText && image.altText.trim() !== ''
    );
  }
  
  // 🆕 Clean variant gallery images
  if (cleaned.variants) {
    cleaned.variants = cleaned.variants.map(variant => ({
      ...variant,
      images: {
        ...variant.images,
        gallery: (variant.images?.gallery || []).filter(
          (image: any) => image.url && image.url.trim() !== '' && image.altText && image.altText.trim() !== ''
        )
      }
    }));
  }
  
  // 🆕 Clean empty specifications
  if (cleaned.specifications) {
    cleaned.specifications = cleaned.specifications.filter(spec => 
      spec.sectionTitle?.trim() || (spec.specs && spec.specs.length > 0)
    );
    
    // Clean empty specs within each specification
    cleaned.specifications = cleaned.specifications.map(spec => ({
      ...spec,
      specs: (spec.specs || []).filter(s => s.key?.trim() && s.value?.trim())
    })).filter(spec => spec.specs.length > 0 || spec.sectionTitle?.trim());
  }
  
  // 🆕 Clean empty features
  if (cleaned.features) {
    cleaned.features = cleaned.features.filter(feature => 
      feature.title?.trim() && feature.description?.trim()
    );
  }
  
  // 🆕 Clean empty variant specifications
  if (cleaned.variants) {
    cleaned.variants = cleaned.variants.map(variant => ({
      ...variant,
      specifications: (variant.specifications || []).filter(spec => 
        spec.sectionTitle?.trim() || (spec.specs && spec.specs.length > 0)
      ).map(spec => ({
        ...spec,
        specs: (spec.specs || []).filter(s => s.key?.trim() && s.value?.trim())
      })).filter(spec => spec.specs.length > 0 || spec.sectionTitle?.trim())
    }));
  }
  
  // 🆕 Clean empty arrays
  if (cleaned.tags && cleaned.tags.length === 0) delete cleaned.tags;
  if (cleaned.linkedProducts && cleaned.linkedProducts.length === 0) delete cleaned.linkedProducts;
  if (cleaned.manufacturerImages && cleaned.manufacturerImages.length === 0) delete cleaned.manufacturerImages;
  
  // 🆕 Clean empty strings and zero values for optional fields
  if (cleaned.hsn === '') delete cleaned.hsn;
  if (cleaned.mrp === 0) delete cleaned.mrp;
  if (cleaned.canonicalUrl === '') delete cleaned.canonicalUrl;
  if (cleaned.notes === '') delete cleaned.notes;
  if (cleaned.label === '') delete cleaned.label;
  if (cleaned.definition === '') delete cleaned.definition;
  
  return cleaned;
};

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };
const handleCancel = () => {
  // 🆕 Show appropriate cancellation message based on context
  if (initialData) {
    toast.info('Product update cancelled');
  } else {
    toast.info('Product creation cancelled');
  }
  
  setIsInitialized(false);
  setFormData(initialProductData);
  if (onCancel) onCancel();
};

const sections = [
    { id: 'basic', label: 'Basic Info', component: BasicInfoSection },
    { id: 'pricing', label: 'Pricing & Inventory', component: PricingInventorySection },
    { id: 'images', label: 'Images', component: ImagesSection },
    { id: 'variants', label: 'Variants', component: VariantsSection },
    { id: 'specs', label: 'Specifications', component: SpecificationsSection },
    { id: 'features', label: 'Features', component: FeaturesSection },
    { id: 'dimensions', label: 'Dimensions & Weight', component: DimensionsWeightSection },
    { id: 'linked', label: 'Linked Products', component: LinkedProductsSection }, // 🆕 Add this section
    { id: 'seo', label: 'SEO & Meta', component: SeoSection },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

  // 🆕 Combined loading state
  const isLoading = loading || submitLoading;

  if (!isInitialized) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* ... (your existing form header) */}

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Form Content */}
          <div className="flex-1 p-6">
            {ActiveComponent && (
              <ActiveComponent
                formData={formData}
                updateFormData={updateFormData}
                brands={brands}
                categories={categories}
                isEditMode={!!initialData}
                currentProductId={currentProductId} // 🆕 Pass current product ID
              />
            )}
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              All fields marked with <span className="text-red-500">*</span> are required
              {initialData && (
                <span className="ml-2 text-blue-600">
                  • Editing: {formData.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;