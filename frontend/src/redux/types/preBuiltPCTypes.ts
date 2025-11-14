export interface PerformanceSummary {
  gamingPerformance: number;
  productivityPerformance: number;
  thermalPerformance: number;
  powerEfficiency: number;
  overallRating: number;
  strengths: string[];
  limitations: string[];
  recommendedUse: string[];
}

// redux/types/preBuiltPCTypes.ts

export interface PreBuiltPC {
  _id: string;
  name: string;
  slug: string;
  category: 'Gaming' | 'Office' | 'Editing' | 'Budget' | 'Workstation' | 'Streaming';
  description: string;
  shortDescription?: string;
  images: Array<{
    public_id: string;
    url: string;
  }>;
  tags: string[];
  components: Component[];
  
  // Test Results
  benchmarkTests: BenchmarkTest[];
  performanceSummary?: PerformanceSummary;
  testNotes?: string;
  testedBy?: string;
  testDate?: Date;
  isTested: boolean;
  
  // Pricing
  totalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  
  // ✅ ADD THESE REQUIRED FIELDS FOR PRODUCT COMPATIBILITY
  basePrice: number;        // Required for product compatibility
  offerPrice: number;       // Required for product compatibility
  averageRating: number;    // Required for product compatibility
  totalReviews: number;     // Required for product compatibility
  condition: string;        // Required for product compatibility
  
  // Inventory
  stockQuantity: number;
  isActive: boolean;
  featured: boolean;
  warranty: string;
  performanceRating: number;
  
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Rest of your existing types remain the same...
export interface Component {
  partType: string;
  name: string;
  brand: string;
  specs: string;
  image?: {
    public_id: string;
    url: string;
  };
}

export interface BenchmarkTest {
  _id?: string;
  testName: string;
  testCategory: 'Gaming' | 'Synthetic' | 'Productivity' | 'Thermal' | 'Power Consumption';
  score: number;
  unit: string;
  description?: string;
  settings?: {
    resolution: string;
    quality: string;
    otherSettings?: string;
  };
  comparison?: {
    betterThan: number;
    averageScore: number;
  };
  testedAt?: Date;
}

export interface PreBuiltPCsResponse {
  success: boolean;
  data: PreBuiltPC[];
  count: number;
  total: number;
  filteredTotal: number;
  resPerPage: number;
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PreBuiltPCFilters {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  search?: string;
  sortBy?: 'featured' | 'newest' | 'price-low' | 'price-high' | 'performance' | 'gaming' | 'productivity';
  featured?: boolean;
  minRating?: number;
  inStock?: boolean;
}

export interface AvailablePreBuiltPCFilters {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  baseMinPrice: number;
  baseMaxPrice: number;
}

export interface PreBuiltPCState {
  preBuiltPCs: PreBuiltPC[];
  featuredPCs: PreBuiltPC[];
  currentPC: PreBuiltPC | null;
  loading: boolean;
  error: string | null;
  filters: PreBuiltPCFilters;
  availableFilters: AvailablePreBuiltPCFilters;
  totalPages: number;
  totalProducts: number;
  currentPage: number;
  searchResults: PreBuiltPC[];
  searchLoading: boolean;
}