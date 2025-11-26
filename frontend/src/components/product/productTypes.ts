// src/types/productTypes.ts
export interface Image {
  url: string;
  altText: string;
  sectionTitle?: string; // 🆕 For manufacturer images
}

export interface VariantSpec {
  key: string;
  value: string;
}

export interface SpecificationSection {
  sectionTitle: string;
  specs: VariantSpec[];
}

export interface Feature {
  title: string;
  description: string;
}

export interface Review {
  user: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: string;
}

export interface Weight {
  value?: number;
  unit: string;
}

export interface Meta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface IdentifyingAttribute {
  key: string;
  label: string;
  value: string;
  displayValue: string;
  hexCode?: string;
  isColor?: boolean;
  _id: string;
}

export interface VariantImages {
  thumbnail?: Image;
  gallery: Image[];
}

export interface Variant {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  mrp?: number; // 🆕 MRP for variants
  offerPrice: number;
  hsn?: string; // 🆕 HSN for variants
  stockQuantity: number;
  identifyingAttributes: IdentifyingAttribute[];
  images: VariantImages;
  isActive: boolean;
  specifications: SpecificationSection[];
  slug?: string; // 🆕 Variant slug
}

export interface ProductData {
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
  label?: string;
  isActive: boolean;
  status: string;
  description?: string;
  definition?: string;
  
  // 🆕 NEW FIELDS
  hsn?: string; // HSN code
  mrp?: number; // Maximum Retail Price
  manufacturerImages?: Image[]; // A+ content images
  
  // 🆕 VIRTUAL FIELDS (from backend)
  sellingPrice?: number; // Virtual: Always uses variant prices if variants exist
  displayMrp?: number; // Virtual: Always uses variant MRP if variants exist
  calculatedDiscount?: number; // Virtual: Dynamic discount calculation
  priceRange?: { // Virtual: Shows min-max price range for variants
    min: number;
    max: number;
    hasRange: boolean;
  };
  hasActiveVariants?: boolean; // Virtual: Checks if product has active variants
  totalStock?: number; // Virtual: Total stock across all variants
  availableColors?: Array<{
    value: string;
    displayValue: string;
    hexCode: string;
    stock: number;
    variants: string[];
  }>;
  
  // Pricing fields (kept for backward compatibility)
  basePrice: number;
  offerPrice: number;
  discountPercentage: number;
  taxRate?: number;
  stockQuantity: number;
  
  variants: Variant[];
  averageRating: number;
  totalReviews: number;
  slug: string;
  createdAt: string;
  
  images: {
    thumbnail: Image;
    hoverImage?: Image;
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