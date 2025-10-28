// src/types/productTypes.ts
export interface Image {
  url: string;
  altText: string;
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
  offerPrice: number;
  stockQuantity: number;
  identifyingAttributes: IdentifyingAttribute[];
  images: VariantImages;
  isActive: boolean;
  specifications: SpecificationSection[];
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