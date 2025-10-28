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
  
  // Images
  images: {
    thumbnail: ImageData;
    hoverImage?: ImageData;
    gallery: ImageData[];
  };
  
  // Pricing & Inventory
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  taxRate: number;
  sku: string;
  barcode: string;
  stockQuantity: number;
  hasVariants?: boolean;
  
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
  
  // Images
  images: {
    thumbnail: ImageData;
    hoverImage?: ImageData;
    gallery: ImageData[];
  };
  
  // Pricing & Inventory
  basePrice: number;
  offerPrice: number;
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
  offerPrice: number;
  stockQuantity: number;
  identifyingAttributes: IdentifyingAttribute[];
  images: {
    thumbnail?: ImageData;
    gallery: ImageData[];
  };
  isActive: boolean;
  specifications: Specification[];
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