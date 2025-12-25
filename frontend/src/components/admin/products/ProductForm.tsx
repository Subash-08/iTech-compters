// src/components/admin/products/ProductForm.tsx
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
import LinkedProductsSection from './LinkedProductsSection';
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
  images: {
    thumbnail: { url: '', altText: '' },
    hoverImage: { url: '', altText: '' } as any, // if your type has it
    gallery: []
  },
  // if your type includes this, keep it – otherwise add it to type definition
  manufacturerImages: [],

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
    variantAttributes: [],
    attributes: []
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
  initialData?: Partial<ProductFormData> & { _id?: string };
  onSubmit: (data: FormData) => Promise<any>;
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
  const [uploadedFiles, setUploadedFiles] = useState({
  thumbnail: undefined as File | undefined,
  hoverImage: undefined as File | undefined,
  gallery: [] as File[],
  manufacturer: [] as File[]
});
  const currentProductId = initialData?._id;

  const showErrorToast = (error: any) => {
    let errorMessage = 'An unexpected error occurred';

    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    toast.error(errorMessage);
    console.error('Product Form Error:', error);
  };

  // Initialize / merge initialData once
  useEffect(() => {
    if (initialData && !isInitialized) {
      const merged: ProductFormData = {
        ...initialProductData,
        ...initialData,
        images: {
          ...initialProductData.images,
          ...(initialData.images || {}),
          thumbnail: {
            url: initialData.images?.thumbnail?.url || (initialData as any).images?.thumbnail || initialProductData.images.thumbnail.url,
            altText: initialData.images?.thumbnail?.altText || initialProductData.images.thumbnail.altText
          },
          hoverImage: {
            ...(initialProductData.images as any).hoverImage,
            ...(initialData.images as any)?.hoverImage
          },
          gallery: initialData.images?.gallery || initialProductData.images.gallery
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
        description:
          initialData.description && initialData.description !== ''
            ? initialData.description
            : initialProductData.description,
        definition:
          initialData.definition && initialData.definition !== ''
            ? initialData.definition
            : initialProductData.definition,
        label:
          initialData.label && initialData.label !== ''
            ? initialData.label
            : initialProductData.label,
        sku:
          initialData.sku && initialData.sku !== ''
            ? initialData.sku
            : initialProductData.sku,
        barcode:
          initialData.barcode && initialData.barcode !== ''
            ? initialData.barcode
            : initialProductData.barcode,
        warranty:
          initialData.warranty && initialData.warranty !== ''
            ? initialData.warranty
            : initialProductData.warranty,
        canonicalUrl:
          initialData.canonicalUrl && initialData.canonicalUrl !== ''
            ? initialData.canonicalUrl
            : initialProductData.canonicalUrl,
        notes:
          initialData.notes && initialData.notes !== ''
            ? initialData.notes
            : initialProductData.notes,
        tags:
          Array.isArray(initialData.tags) && initialData.tags.length > 0
            ? initialData.tags
            : initialProductData.tags,
        specifications:
          Array.isArray(initialData.specifications) &&
          initialData.specifications.length > 0
            ? initialData.specifications
            : initialProductData.specifications,
        features:
          Array.isArray(initialData.features) && initialData.features.length > 0
            ? initialData.features
            : initialProductData.features,
        linkedProducts:
          Array.isArray(initialData.linkedProducts) &&
          initialData.linkedProducts.length > 0
            ? initialData.linkedProducts
            : initialProductData.linkedProducts,
        variants:
          Array.isArray(initialData.variants) &&
          initialData.variants.length > 0
            ? initialData.variants
            : initialProductData.variants,
        manufacturerImages:
          Array.isArray((initialData as any).manufacturerImages)
            ? (initialData as any).manufacturerImages
            : initialProductData.manufacturerImages
      };

      setFormData(merged);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      setFormData(initialProductData);
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Fetch brands & categories
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
        : brandsData.brands || brandsData.data || [];

      const categories = Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData.categories || categoriesData.data || [];

      setBrands(brands);
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching brands and categories:', error);
      showErrorToast(error);
      setBrands([]);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchBrandsAndCategories();
  }, []);

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
const cleanedVariants = formData.variants.map(variant => {
  const cleanedVariant = { ...variant };
  
  // Fix thumbnail - ensure it has a URL
  if (cleanedVariant.images?.thumbnail) {
    // If it has _fileUpload but no proper URL, set a placeholder
    if (cleanedVariant.images.thumbnail._fileUpload && 
        (!cleanedVariant.images.thumbnail.url || 
         cleanedVariant.images.thumbnail.url.includes('file-upload:'))) {
      // Keep the placeholder URL
      cleanedVariant.images.thumbnail.url = cleanedVariant.images.thumbnail.url || 
        `file-upload:${Date.now()}`;
    }
    // Remove the _fileUpload flag before sending
    delete cleanedVariant.images.thumbnail._fileUpload;
  }
  
  // Fix gallery items
  if (cleanedVariant.images?.gallery) {
    cleanedVariant.images.gallery = cleanedVariant.images.gallery.map((img: any) => {
      const cleanedImg = { ...img };
      // Remove _fileUpload flag
      delete cleanedImg._fileUpload;
      return cleanedImg;
    }).filter((img: any) => img.url && img.url.trim() !== '');
  }
  
  return cleanedVariant;
});

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setSubmitLoading(true);

  

  try {
    // -------- Frontend validation --------
    const errors: string[] = [];

    if (!formData.name?.trim()) errors.push('Product name is required');
    if (!formData.description?.trim())
      errors.push('Product description is required');
    if (!formData.brand) errors.push('Brand is required');
    if (!formData.categories.length)
      errors.push('At least one category is required');

    // basePrice only required when NOT a variant product
    if (!formData.variantConfiguration.hasVariants) {
      if (!formData.basePrice || formData.basePrice <= 0) {
        errors.push('Valid base price is required for non-variant products');
      }
    }

    // Thumbnail required (either existing URL or new selection)
    if (
      !formData.images?.thumbnail?.url ||
      formData.images.thumbnail.url.trim() === ''
    ) {
      errors.push('Thumbnail image is required');
    }

    // Validate variant images if variants exist
    if (formData.variantConfiguration.hasVariants) {
      formData.variants.forEach((variant, index) => {
        // Variant name is required
        if (!variant.name?.trim()) {
          errors.push(`Variant #${index + 1}: Name is required`);
        }
        
        // Variant price is required
        if (!variant.price || variant.price <= 0) {
          errors.push(`Variant "${variant.name || `#${index + 1}`}": Valid price is required`);
        }
        
        // Variant SKU is required
        if (!variant.sku?.trim()) {
          errors.push(`Variant "${variant.name || `#${index + 1}`}": SKU is required`);
        }
      });
    }

    if (errors.length > 0) {
      errors.forEach(msg => toast.error(msg));
      setSubmitLoading(false);
      return;
    }

    // -------- Build FormData --------
    const fd = new FormData();

    // 🔹 Basic product fields
    fd.append("name", formData.name);
    fd.append("brand", formData.brand);
    fd.append("categories", JSON.stringify(formData.categories));
    fd.append("description", formData.description);
    fd.append("definition", formData.definition || "");
    fd.append("status", formData.status || "Draft");
    fd.append("isActive", String(formData.isActive));
    fd.append("condition", formData.condition || "New");
    
    // ADD MISSING TEXT FIELDS
    fd.append("label", formData.label || "");
    fd.append("hsn", formData.hsn || "");
    fd.append("warranty", formData.warranty || "");
    fd.append("notes", formData.notes || "");
    fd.append("canonicalUrl", formData.canonicalUrl || "");

    // REQUIRED — Pricing and Inventory
    fd.append("basePrice", String(formData.basePrice || 0));
    fd.append("mrp", String(formData.mrp || formData.basePrice || 0));
    fd.append("stockQuantity", String(formData.stockQuantity || 0));
    
    // ADD MISSING PRICING FIELDS
    fd.append("taxRate", String(formData.taxRate || 0));
    fd.append("sku", formData.sku || "");
    fd.append("barcode", formData.barcode || "");

    // 🔹 SEO + Linked Products
    fd.append("tags", JSON.stringify(formData.tags || []));
    fd.append("meta", JSON.stringify(formData.meta || {}));
    fd.append("linkedProducts", JSON.stringify(formData.linkedProducts || []));

    // 🔹 Clean variants and handle variant image files
    const cleanedVariants = formData.variants.map((variant, variantIndex) => {
      const cleanedVariant = { ...variant };
      
      // Handle variant thumbnail files
      if (variant._thumbnailFile) {
        // Append the file with simple field name for backend
        fd.append(`variantThumbnail_${variantIndex}`, variant._thumbnailFile);
        
        // Remove temporary file property from variant data
        delete cleanedVariant._thumbnailFile;
        
        // If we have a blob URL for preview, don't send it
        if (cleanedVariant.images?.thumbnail?.url?.startsWith('blob:')) {
          cleanedVariant.images.thumbnail.url = ''; // Will be set by backend
        }
      }
      
      // Handle variant gallery files
      if (variant._galleryFiles && variant._galleryFiles.length > 0) {
        variant._galleryFiles.forEach((file, fileIndex) => {
          fd.append(`variantGallery_${variantIndex}_${fileIndex}`, file);
        });
        
        // Remove temporary file property
        delete cleanedVariant._galleryFiles;
        
        // Filter out blob URLs from gallery (they're just previews)
        if (cleanedVariant.images?.gallery) {
          cleanedVariant.images.gallery = cleanedVariant.images.gallery.filter(img => 
            !img.url.startsWith('blob:')
          );
        }
      }
      
      // Send existing gallery URLs separately (not blobs)
      if (cleanedVariant.images?.gallery && cleanedVariant.images.gallery.length > 0) {
        const existingGallery = cleanedVariant.images.gallery.filter(img => 
          img.url && !img.url.startsWith('blob:')
        );
        
        if (existingGallery.length > 0) {
          // Store in variant data, backend will process it
          cleanedVariant.images.gallery = existingGallery;
        }
      }
      
      // Clean up temporary file properties from images
      if (cleanedVariant.images) {
        // Clean thumbnail
        if (cleanedVariant.images.thumbnail) {
          delete cleanedVariant.images.thumbnail._fileUpload;
          delete cleanedVariant.images.thumbnail.file;
          
          // If it's a blob URL and we're not uploading a file, clear it
          if (cleanedVariant.images.thumbnail.url?.startsWith('blob:') && !variant._thumbnailFile) {
            delete cleanedVariant.images.thumbnail.url;
          }
        }
        
        // Clean gallery
        if (cleanedVariant.images.gallery) {
          cleanedVariant.images.gallery = cleanedVariant.images.gallery.map(img => {
            const cleanImg = { ...img };
            delete cleanImg._fileUpload;
            delete cleanImg.file;
            delete cleanImg._file;
            return cleanImg;
          }).filter(img => img.url && img.url.trim() !== '');
        }
      }
      
      // Ensure variant has images object
      if (!cleanedVariant.images) {
        cleanedVariant.images = { gallery: [] };
      }
      
      // Remove any frontend-only properties
      delete cleanedVariant._id; // Remove _id if it exists (backend will handle)
      delete cleanedVariant.createdAt;
      delete cleanedVariant.updatedAt;
      delete cleanedVariant._variantIndex;
      
      return cleanedVariant;
    });

    // 🆕 CRITICAL FIX: Stringify variants PROPERLY
    const variantsString = JSON.stringify(cleanedVariants);
    fd.append("variants", variantsString);

    // Append variantConfiguration
    fd.append("variantConfiguration", JSON.stringify(formData.variantConfiguration || {}));

    // 🔹 Manufacturer images
    fd.append("manufacturerImages", JSON.stringify(formData.manufacturerImages || []));
    
    // 🔹 PRODUCT IMAGES
    // Thumbnail
    if (uploadedFiles.thumbnail) {
      fd.append("thumbnail", uploadedFiles.thumbnail);
    } else if (formData.images.thumbnail.url && !formData.images.thumbnail.url.startsWith("blob:")) {
      // Editing mode with existing URL
      fd.append("thumbnailUrl", formData.images.thumbnail.url);
    } else {
      throw new Error("Thumbnail image is required");
    }
    fd.append("thumbnailAlt", formData.images.thumbnail.altText || "");

    // Hover Image
    if (uploadedFiles.hoverImage) {
      fd.append("hoverImage", uploadedFiles.hoverImage);
    } else if (
      formData.images.hoverImage?.url &&
      !formData.images.hoverImage.url.startsWith("blob:")
    ) {
      fd.append("hoverImageUrl", formData.images.hoverImage.url);
    }
    fd.append("hoverImageAlt", formData.images.hoverImage?.altText || "");

    // Gallery Images
    uploadedFiles.gallery.forEach(file => {
      fd.append("gallery", file);
    });
    fd.append(
      "galleryUrls",
      JSON.stringify(
        formData.images.gallery
          .filter(img => img.url && !img.url.startsWith("blob:"))
          .map(img => ({ url: img.url, altText: img.altText }))
      )
    );

    // Manufacturer Images
    uploadedFiles.manufacturer.forEach(file => {
      fd.append("manufacturerImages", file);
    });
    fd.append(
      "manufacturerImageUrls",
      JSON.stringify(
        (formData.manufacturerImages || [])
          .filter(img => img.url && !img.url.startsWith("blob:"))
          .map(img => ({
            url: img.url,
            altText: img.altText,
            sectionTitle: img.sectionTitle
          }))
      )
    );

    // 🔹 Specifications and Features
    fd.append("specifications", JSON.stringify(formData.specifications || []));
    fd.append("features", JSON.stringify(formData.features || []));
    fd.append("dimensions", JSON.stringify(formData.dimensions || {}));
    fd.append("weight", JSON.stringify(formData.weight || {}));

    // Clean up blob URLs before submitting
    const cleanupBlobUrls = () => {
      // Clean product thumbnail blob URL
      if (formData.images.thumbnail.url?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.images.thumbnail.url);
      }
      
      // Clean product hover image blob URL
      if (formData.images.hoverImage?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(formData.images.hoverImage.url);
      }
      
      // Clean product gallery blob URLs
      formData.images.gallery.forEach(img => {
        if (img.url?.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      
      // Clean variant blob URLs
      formData.variants.forEach(variant => {
        if (variant.images?.thumbnail?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(variant.images.thumbnail.url);
        }
        variant.images?.gallery?.forEach(img => {
          if (img.url?.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
      });
    };

    try {
      await onSubmit(fd);

      
      
      // Clean up blob URLs after successful submission
      cleanupBlobUrls();
      
      toast.success(
        initialData ? 'Product updated successfully!' : 'Product created successfully!'
      );
    } catch (submitError) {
      // Still clean up blob URLs on error
      cleanupBlobUrls();
      throw submitError;
    }
  } catch (err) {
    showErrorToast(err);
  } finally {
    setSubmitLoading(false);
  }
};

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleCancel = () => {
    toast.info('Product creation cancelled');
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
    { id: 'linked', label: 'Linked Products', component: LinkedProductsSection },
    { id: 'seo', label: 'SEO & Meta', component: SeoSection }
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component;
  const isLoading = loading || submitLoading;

  if (!isInitialized) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <nav className="p-4 space-y-1">
              {sections.map(section => (
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
    currentProductId={currentProductId}

    {...(activeSection === "images"
      ? {
          onFilesChange: (files: any) =>
            setUploadedFiles(prev => ({ ...prev, ...files })),
          uploadedFiles: uploadedFiles
        }
      : {})}
  />
)}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              All fields marked with <span className="text-red-500">*</span> are required
              {initialData && (
                <span className="ml-2 text-blue-600">• Editing: {formData.name}</span>
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
                {isLoading
                  ? 'Saving...'
                  : initialData
                  ? 'Update Product'
                  : 'Publish Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
