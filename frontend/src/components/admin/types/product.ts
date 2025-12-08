export interface Product {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  brand: Brand | string;
  categories: Category[] | string[];
  tags: string[];
  condition: 'New' | 'Used' | 'Refurbished';
  label: string;
  isActive: boolean;
  status: 'Draft' | 'Published' | 'OutOfStock' | 'Archived' | 'Discontinued';
  description: string;
  definition: string;
  
  // 🆕 NEW FIELDS
  hsn?: string; // HSN code for tax purposes
  mrp?: number; // Maximum Retail Price (strikethrough price)
  manufacturerImages?: ImageData[]; // A+ content images from manufacturer
  
  // Images
  images: {
    thumbnail: ImageData;
    hoverImage?: ImageData;
    gallery: ImageData[];
  };
  
  // Pricing & Inventory - 🆕 UPDATED
  basePrice: number;
  offerPrice: number; // Kept for backward compatibility
  discountPercentage: number;
  taxRate: number;
  sku: string;
  barcode: string;
  stockQuantity: number;
  hasVariants?: boolean;
  
  // 🆕 VIRTUAL FIELDS (from backend - for display)
  sellingPrice?: number; // Virtual: Always uses variant prices if variants exist, otherwise product basePrice
  displayMrp?: number; // Virtual: Always uses variant MRP if variants exist, otherwise product MRP
  calculatedDiscount?: number; // Virtual: Dynamic discount calculation based on MRP vs selling price
  priceRange?: { // Virtual: Shows min-max price range for variants
    min: number;
    max: number;
    hasRange: boolean;
  };
  hasActiveVariants?: boolean; // Virtual: Checks if product has active variants
  
  // Variants
  variantConfiguration: VariantConfiguration;
  variants: ProductVariant[];
  
  // Specifications & Features
  specifications: Specification[];
  features: Feature[];
  
  // Dimensions & Weight
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm';
  };
  weight: {
    value: number;
    unit: 'g' | 'kg' | 'lb' | 'oz';
  };
  
  // Reviews & Ratings
  averageRating?: number;
  totalReviews?: number;
  
  warranty: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  canonicalUrl: string;
  linkedProducts: string[];
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  // Basic Information
  name: string;
  brand: string;
  categories: string[];
  tags: string[];
  condition: 'New' | 'Used' | 'Refurbished';
  label: string;
  isActive: boolean;
  status: 'Draft' | 'Published' | 'OutOfStock' | 'Archived' | 'Discontinued';
  description: string;
  definition: string;
  
  // 🆕 NEW FIELDS
  hsn?: string;
  mrp?: number;
  manufacturerImages?: ImageData[];
  
  // Images
  images: {
    thumbnail: ImageData;
    hoverImage?: ImageData;
    gallery: ImageData[];
  };
  
  // Pricing & Inventory - 🆕 UPDATED
  basePrice: number;
  offerPrice: number; // Kept for backward compatibility
  discountPercentage: number;
  taxRate: number;
  sku: string;
  barcode: string;
  stockQuantity: number;
  
  // Variants
  variantConfiguration: VariantConfiguration;
  variants: ProductVariant[];
  
  // Specifications & Features
  specifications: Specification[];
  features: Feature[];
  
  // Dimensions & Weight
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm';
  };
  weight: {
    value: number;
    unit: 'g' | 'kg' | 'lb' | 'oz';
  };
  
  warranty: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  canonicalUrl: string;
  linkedProducts: string[];
  notes: string;
}

export interface ImageData {
  url: string;
  altText: string;
  sectionTitle?: string;
  file?: File;
  _fileUpload?: File;
}

export interface VariantConfiguration {
  hasVariants: boolean;
  variantType: 'None' | 'Specifications' | 'Attributes' | 'Mixed' | 'Color';
  variantCreatingSpecs: VariantSpec[];
  variantAttributes: VariantAttribute[];
}

export interface VariantSpec {
  sectionTitle: string;
  specKey: string;
  specLabel: string;
  possibleValues: string[];
}

export interface VariantAttribute {
  key: string;
  label: string;
  values: string[];
}

export interface ProductVariant {
  _id?: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  mrp?: number; // 🆕 MRP for variants
  offerPrice: number; // Kept for backward compatibility
  hsn?: string; // 🆕 HSN for variants
  stockQuantity: number;
  identifyingAttributes: IdentifyingAttribute[];
  images: {
    thumbnail?: ImageData;
    gallery: ImageData[];
  };
  isActive: boolean;
  specifications: Specification[];
   _thumbnailFile?: File;
  _galleryFiles?: File[];
}

export interface IdentifyingAttribute {
  key: string;
  label: string;
  value: string;
  displayValue: string;
  hexCode: string;
  isColor: boolean;
}

export interface Specification {
  sectionTitle: string;
  specs: { key: string; value: string }[];
}

export interface Feature {
  title: string;
  description: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductFilters {
  search: string;
  category: string;
  brand: string;
  status: string;
  inStock: string;
  sort: string;
  page: number;
  limit: number;
}

// 🆕 ADD: For product listing display with new virtual fields
export interface ProductListingItem {
  id: string;
  name: string;
  slug: string;
  brand: Brand;
  categories: Category[];
  images: {
    thumbnail: ImageData;
  };
  // 🆕 USE VIRTUAL FIELDS for display
  sellingPrice: number; // What customer pays (variant priority)
  displayMrp: number; // Strikethrough price (variant priority)
  calculatedDiscount: number; // Discount percentage
  priceRange?: { // For variants price range
    min: number;
    max: number;
    hasRange: boolean;
  };
  hasVariants: boolean;
  hasActiveVariants?: boolean;
  variantConfiguration: VariantConfiguration;
  averageRating?: number;
  totalReviews?: number;
  stockQuantity: number;
  hsn?: string;
  mrp?: number;
}

// 🆕 ADD: Price display helper types
export interface ProductPriceDisplay {
  sellingPrice: number;
  displayMrp: number;
  calculatedDiscount: number;
  hasDiscount: boolean;
  priceRange?: {
    min: number;
    max: number;
    hasRange: boolean;
  };
}