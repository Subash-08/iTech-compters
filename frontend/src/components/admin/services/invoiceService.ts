// services/invoiceService.ts - FIXED VERSION
import { toast } from 'react-toastify';
import api from '../../config/axiosConfig';
import {
  Invoice,
  CreateInvoiceData,
  InvoiceFilters,
  InvoiceStats,
  ProductSearchResult,
  PreBuiltPCSearchResult,
  Category
} from '../types/invoice';

export const invoiceService = {
  async createInvoice(data: CreateInvoiceData) {
    try {
      // Add calculated totals to each product
      const productsWithTotals = data.products.map(product => ({
        ...product,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      }));

      // Add calculated totals to each custom product
      const customProductsWithTotals = data.customProducts?.map(product => ({
        ...product,
        total: product.quantity * product.unitPrice,
        gstAmount: (product.quantity * product.unitPrice) * (product.gstPercentage / 100)
      })) || [];

      // Add calculated totals to each pre-built PC
      const preBuiltPCsWithTotals = data.preBuiltPCs.map(pc => ({
        ...pc,
        total: pc.quantity * pc.unitPrice,
        gstAmount: (pc.quantity * pc.unitPrice) * (pc.gstPercentage / 100)
      }));

      // Calculate overall totals
      const subtotal = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.total, 0);
      
      const totalGst = [...productsWithTotals, ...customProductsWithTotals, ...preBuiltPCsWithTotals]
        .reduce((sum, item) => sum + item.gstAmount, 0);

      const grandTotal = subtotal + totalGst + (data.totals.shipping || 0) - (data.totals.discount || 0);

      // Prepare complete invoice data
      const completeInvoiceData = {
        ...data,
        products: productsWithTotals,
        customProducts: customProductsWithTotals,
        preBuiltPCs: preBuiltPCsWithTotals,
        totals: {
          ...data.totals,
          subtotal: subtotal,
          totalGst: totalGst,
          grandTotal: grandTotal,
          roundOff: Math.round(grandTotal) - grandTotal
        },
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
      };

      console.log('Sending invoice data:', completeInvoiceData);
      
      const response = await api.post('/admin/invoices', completeInvoiceData);
      return response.data;
      
    } catch (error) {
      console.error('Invoice creation failed:', error);
      throw error;
    }
  },

  // Get all invoices with filters
  async getInvoices(filters: InvoiceFilters = {}) {
    const response = await api.get('/admin/invoices', { params: filters });
    return response.data;
  },

  // Get single invoice
  async getInvoice(id: string) {
    const response = await api.get(`/admin/invoices/${id}`);
    return response.data;
  },

  // Update invoice
  async updateInvoice(id: string, data: Partial<CreateInvoiceData>) {
    const response = await api.put(`/admin/invoices/${id}`, data);
    return response.data;
  },

  // Delete invoice
  async deleteInvoice(id: string) {
    const response = await api.delete(`/admin/invoices/${id}`);
    return response.data;
  },

  // Generate PDF
  async generateInvoicePDF(id: string) {
    const response = await api.post(`/admin/invoices/${id}/generate-pdf`);
    return response.data;
  },

  // Download PDF
  async downloadInvoicePDF(id: string) {
    const response = await api.get(`/admin/invoices/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  // Get invoice statistics
  async getInvoiceStats(startDate?: string, endDate?: string) {
    const response = await api.get('/admin/invoices/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Search invoices
  async searchInvoices(query: string) {
    const response = await api.get('/admin/invoices/search', {
      params: { query }
    });
    return response.data;
  },

  // Get recent invoices
  async getRecentInvoices() {
    const response = await api.get('/admin/invoices/recent');
    return response.data;
  }
};

// Product search service - FIXED with correct function name
export const productSearchService = {
  async searchProducts(query: string, category?: string) {
    try {
      const params: any = {
        search: query,
        limit: 12, // Show 12 products initially
        page: 1
      };
      
      if (category) {
        params.category = category;
      }
      
      console.log('Searching products with params:', params);
      const response = await api.get('/products', { params });
      console.log('Full API response:', response.data);
      
      // Handle different API response structures
      let products = [];
      
      if (response.data.data?.products) {
        products = response.data.data.products;
      } else if (response.data.products) {
        products = response.data.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }
      
      console.log('Extracted products:', products);
      
      // Transform to match your expected structure
      const transformedProducts = products.map((product: any) => ({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        // Price handling
        basePrice: product.basePrice,
        effectivePrice: product.effectivePrice,
        price: product.basePrice,
        salePrice: product.effectivePrice,
        mrp: product.mrp,
        // Stock
        stockQuantity: product.stockQuantity || 0,
        stock: product.stockQuantity || 0,
        // GST
        gstPercentage: product.gstPercentage || 18,
        // Categories
        categories: product.categories || [],
        category: product.categories?.[0]?.name || '',
        // Brand
        brand: product.brand || null,
        // Images
        images: product.images || {},
        // Additional fields
        condition: product.condition || 'New',
        description: product.description || '',
        variantConfiguration: product.variantConfiguration,
        variants: product.variants || [],
        tags: product.tags || [],
        // SKU
        sku: product.sku || product._id.substring(0, 8)
      }));
      
      console.log('Transformed products:', transformedProducts);
      return transformedProducts;
      
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
      return [];
    }
  },

  // Get product by ID
  async getProductById(id: string) {
    try {
      const response = await api.get(`/products/slug/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }
};

// Category service - FIXED
export const categoryService = {
  // Get all categories
  async getCategories() {
    try {
      const response = await api.get('/categories');
      console.log('Categories API response:', response.data);
      
      // Handle your API response structure
      if (response.data.categories) {
        return response.data.categories;
      } else if (response.data.data?.categories) {
        return response.data.data.categories;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.warn('Unexpected categories response format:', response.data);
      return [];
      
    } catch (error: any) {
      console.error('Error loading categories:', error.response?.data || error.message);
      toast.error('Failed to load categories');
      return [];
    }
  },

  // Get category by slug
  async getCategoryBySlug(slug: string) {
    try {
      const response = await api.get(`/category/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error getting category:', error);
      return null;
    }
  }
};

// Pre-built PC service - FIXED
export const preBuiltPCService = {
  // Search pre-built PCs
  async searchPreBuiltPCs(query: string) {
    try {
      const params: any = {
        limit: 12
      };
      
      if (query.trim()) {
        params.search = query;
      }
      
      console.log('Searching pre-built PCs with params:', params);
      const response = await api.get('/prebuilt-pcs', { params });
      console.log('Pre-built PCs API response:', response.data);
      
      // Handle different response formats
      let pcs = [];
      
      if (response.data.data) {
        pcs = response.data.data;
      } else if (response.data.pcs) {
        pcs = response.data.pcs;
      } else if (Array.isArray(response.data)) {
        pcs = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        pcs = response.data.data;
      }
      
      console.log('Extracted PCs count:', pcs.length);
      
      // Transform to match expected structure
      const transformedPCs = pcs.map((pc: any) => ({
        _id: pc._id,
        name: pc.name,
        price: pc.price || pc.basePrice,
        salePrice: pc.salePrice || pc.discountPrice || pc.price,
        gstPercentage: pc.gstPercentage || 18,
        components: pc.components || [],
        stock: pc.stockQuantity || pc.stock || 0,
        description: pc.description || '',
        images: pc.images || { thumbnail: { url: pc.image } },
        brand: pc.brand || { name: '' }
      }));
      
      console.log('Transformed first PC:', transformedPCs[0]);
      return transformedPCs;
      
    } catch (error: any) {
      console.error('Error searching pre-built PCs:', error.response?.data || error.message);
      toast.error('Failed to search pre-built PCs');
      return [];
    }
  },

  // Get pre-built PC by ID
  async getPreBuiltPCById(id: string) {
    try {
      const response = await api.get(`/prebuilt-pcs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting pre-built PC:', error);
      return null;
    }
  },

  // Get pre-built PC by slug
  async getPreBuiltPCBySlug(slug: string) {
    try {
      const response = await api.get(`/prebuilt-pcs/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error getting pre-built PC:', error);
      return null;
    }
  }
};