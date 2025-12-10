// types/invoice.ts
export interface CustomerDetails {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  companyName?: string;
  gstin?: string;
  customerId?: string;
}
export interface InvoiceCustomProduct {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  category?: string;
  sku?: string;
  hsnCode?: string;
  isCustom: boolean;
}
export interface InvoiceProduct {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
  category?: string;
  variant?: any;
}

export interface PreBuiltPCComponent {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePreBuiltPC {
  pcId: string;
  name: string;
  components: PreBuiltPCComponent[];
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  total: number;
}

export interface InvoiceTotals {
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  discount: number;
  shipping: number;
  roundOff: number;
}

export interface PaymentDetails {
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  method: 'cash' | 'card' | 'upi' | 'cod' | 'bank_transfer' | 'online';
  transactionId?: string;
  paidAmount?: number;
  paidDate?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: CustomerDetails;
  products: InvoiceProduct[];
  preBuiltPCs: InvoicePreBuiltPC[];
  customProducts: InvoiceCustomProduct[];
  totals: InvoiceTotals;
  payment: PaymentDetails;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  adminNotes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

// Update your types/invoice.ts
export interface CreateInvoiceData {
  customer: CustomerDetails;
  products: Array<{
    productId: string;
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    gstPercentage: number;
    category?: string;
    variant?: any;
  }>;
  preBuiltPCs?: Array<{
    pcId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    gstPercentage: number;
  }>;
   customProducts: InvoiceCustomProduct[];
  totals: {
    discount: number;
    shipping: number;
    subtotal?: number;      // Added
    totalGst?: number;      // Added
    grandTotal?: number;    // Added
    roundOff?: number;      // Added
  };
  payment: {
    status: PaymentDetails['status'];
    method: PaymentDetails['method'];
    transactionId?: string;
    paidAmount?: number;
  };
  invoiceDate?: string;
  dueDate?: string;
  invoiceNumber?: string;
  notes?: string;
  adminNotes?: string;
  status?: string;
}
// Update the ProductSearchResult interface in types/invoice.ts
export interface ProductSearchResult {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  // Price fields
  basePrice?: number;
  effectivePrice?: number;
  salePrice?: number;
  price?: number;
  mrp?: number;
  // Stock
  stockQuantity?: number;
  stock?: number;
  // GST
  gstPercentage?: number;
  // Categories
  categories?: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  category?: string;
  // Brand
  brand?: {
    _id: string;
    name: string;
    slug: string;
  };
  // Images
  images?: {
    thumbnail?: {
      url: string;
      altText: string;
    };
  };
  // Variant info
  condition?: string;
  description?: string;
  variantConfiguration?: any;
  variants?: any[];
  tags?: string[];
}

export interface PreBuiltPCSearchResult {
  _id: string;
  name: string;
  price: number;
  salePrice?: number;
  gstPercentage: number;
  stock: number;
  components: Array<{
    product: {
      _id: string;
      name: string;
      sku?: string;
      price: number;
    };
    quantity: number;
  }>;
  images?: Array<{ url: string; altText: string }>;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    altText: string;
  };
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  averageInvoice: number;
  pendingAmount: number;
  paidAmount: number;
  statusCounts: Array<{ _id: string; count: number }>;
  paymentMethodCounts: Array<{ _id: string; count: number }>;
}