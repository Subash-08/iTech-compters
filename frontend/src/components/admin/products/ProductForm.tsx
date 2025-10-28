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
import api from '../../config/axiosConfig'; // Import your axios config

const initialProductData: ProductFormData = {
  // Basic Information
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
  
  // Images
  images: {
    thumbnail: { url: '', altText: '' },
    gallery: []
  },
  
  // Pricing & Inventory
  basePrice: 0,
  offerPrice: 0,
  discountPercentage: 0,
  taxRate: 0,
  sku: '',
  barcode: '',
  stockQuantity: 0,
  
  // Variants
  variantConfiguration: {
    hasVariants: false,
    variantType: 'None',
    variantCreatingSpecs: [],
    variantAttributes: []
  },
  variants: [],
  
  // Specifications & Features
  specifications: [],
  features: [],
  
  // Dimensions & Weight
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
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
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

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData && !isInitialized) {
      // Deep merge with proper empty string handling
      const mergedData = {
        ...initialProductData,
        // Override with initialData, but handle empty strings properly
        ...initialData,
        // Handle nested objects with empty string checks
        images: {
          ...initialProductData.images,
          ...(initialData.images || {}),
          // Ensure empty strings are handled for nested image properties
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
        // Handle empty strings for text fields - use actual value if not empty string
        description: initialData.description && initialData.description !== "" ? initialData.description : initialProductData.description,
        definition: initialData.definition && initialData.definition !== "" ? initialData.definition : initialProductData.definition,
        label: initialData.label && initialData.label !== "" ? initialData.label : initialProductData.label,
        sku: initialData.sku && initialData.sku !== "" ? initialData.sku : initialProductData.sku,
        barcode: initialData.barcode && initialData.barcode !== "" ? initialData.barcode : initialProductData.barcode,
        warranty: initialData.warranty && initialData.warranty !== "" ? initialData.warranty : initialProductData.warranty,
        canonicalUrl: initialData.canonicalUrl && initialData.canonicalUrl !== "" ? initialData.canonicalUrl : initialProductData.canonicalUrl,
        notes: initialData.notes && initialData.notes !== "" ? initialData.notes : initialProductData.notes,
        // Handle arrays - use empty array if not provided or empty
        tags: Array.isArray(initialData.tags) && initialData.tags.length > 0 ? initialData.tags : initialProductData.tags,
        specifications: Array.isArray(initialData.specifications) && initialData.specifications.length > 0 ? initialData.specifications : initialProductData.specifications,
        features: Array.isArray(initialData.features) && initialData.features.length > 0 ? initialData.features : initialProductData.features,
        linkedProducts: Array.isArray(initialData.linkedProducts) && initialData.linkedProducts.length > 0 ? initialData.linkedProducts : initialProductData.linkedProducts,
        variants: Array.isArray(initialData.variants) && initialData.variants.length > 0 ? initialData.variants : initialProductData.variants
      };
      
      setFormData(mergedData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      // For create mode, ensure clean initial state
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
      setBrands([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchBrandsAndCategories();
  }, []);

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };;
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const errors = [];
    if (!formData.name?.trim()) errors.push('Product name is required');
    if (!formData.description?.trim()) errors.push('Product description is required');
    if (!formData.brand) errors.push('Brand is required');
    if (!formData.categories.length) errors.push('At least one category is required');
    if (!formData.basePrice || formData.basePrice <= 0) errors.push('Valid base price is required');
    if (!formData.images?.thumbnail?.url) errors.push('Thumbnail image is required');

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      alert(`Please fix the following errors:\n${errors.join('\n')}`);
      return;
    }
    
    // Ensure variant stock is calculated correctly
    const finalFormData = { ...formData };
    if (formData.variantConfiguration.hasVariants && formData.variants.length > 0) {
      // Calculate total stock from variants
      finalFormData.stockQuantity = formData.variants.reduce(
        (total, variant) => total + (variant.stockQuantity || 0), 0
      );
    }
    
    onSubmit(finalFormData);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleCancel = () => {
    // Reset form state when canceling
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
    { id: 'seo', label: 'SEO & Meta', component: SeoSection },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

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
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {initialData ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-gray-600 mt-1">
                {initialData ? 'Update product information' : 'Create a new product in your store'}
                {initialData && formData.sku && ` - SKU: ${formData.sku}`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Saving...' : initialData ? 'Update Product' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>

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
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Saving...' : initialData ? 'Update Product' : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;