// services/invoiceService.ts - FIXED CATEGORY FILTERING
import { toast } from 'react-toastify';
import api from '../../config/axiosConfig';
import {
  Invoice,
  CreateInvoiceData,
  InvoiceFilters,
  InvoiceStats,
  ProductSearchResult,
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

      // Calculate overall totals
      const subtotal = [...productsWithTotals, ...customProductsWithTotals]
        .reduce((sum, item) => sum + item.total, 0);
      
      const totalGst = [...productsWithTotals, ...customProductsWithTotals]
        .reduce((sum, item) => sum + item.gstAmount, 0);

      const grandTotal = subtotal + totalGst + (data.totals.shipping || 0) - (data.totals.discount || 0);

      // Prepare complete invoice data
      const completeInvoiceData = {
        ...data,
        products: productsWithTotals,
        customProducts: customProductsWithTotals,
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

// Product search service - FIXED CATEGORY HANDLING
export const productSearchService = {
  async searchProducts(query: string, categorySlug?: string) {
    try {
      const params: any = {
        limit: 12,
        page: 1
      };
      
      // Add search query if provided
      if (query && query.trim()) {
        params.search = query.trim();
      }
      
      // Try different category parameter names based on your API
      if (categorySlug) {
        // Try different parameter names that your API might accept
        params.category = categorySlug; // Most common
        // params.categorySlug = categorySlug;
        // params.categoryName = categorySlug;
      }
      const response = await api.get('/products', { params });
      

      let products = [];
      
      // Try different response structures
      if (response.data.data?.products && Array.isArray(response.data.data.products)) {
        products = response.data.data.products;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        products = response.data.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      } else {
        return [];
      }
      
      // If category is selected, filter on frontend as backup
      if (categorySlug && products.length > 0) {
        const filteredProducts = products.filter((product: any) => {
          // Check various ways category might be stored
          const productCategories = product.categories || [];
          const productCategory = product.category || '';
          
          return (
            // Check if category slug matches
            productCategories.some((cat: any) => 
              cat.slug === categorySlug || 
              cat.name?.toLowerCase() === categorySlug.toLowerCase()
            ) ||
            // Check direct category field
            productCategory === categorySlug ||
            productCategory?.toLowerCase() === categorySlug.toLowerCase()
          );
        });
        products = filteredProducts;
      }
      
      // Transform products
      const transformedProducts = products.map((product: any) => {
       
        return {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          // Price handling with fallbacks
          basePrice: product.basePrice || product.price || 0,
          effectivePrice: product.effectivePrice || product.salePrice || product.price || 0,
          price: product.price || product.basePrice || 0,
          salePrice: product.salePrice || product.effectivePrice || product.price || 0,
          mrp: product.mrp || product.basePrice || product.price || 0,
          // Stock
          stockQuantity: product.stockQuantity || product.stock || 0,
          stock: product.stockQuantity || product.stock || 0,
          // GST
          gstPercentage: product.gstPercentage || 18,
          // Categories
          categories: product.categories || [],
          category: product.category || (product.categories?.[0]?.name) || '',
          // Brand
          brand: product.brand || { name: product.brandName || '' },
          // Images
          images: product.images || { 
            thumbnail: { url: product.image || product.thumbnail || '' },
            main: { url: product.image || '' }
          },
          // Additional fields
          condition: product.condition || 'New',
          description: product.description || '',
          variantConfiguration: product.variantConfiguration,
          variants: product.variants || [],
          tags: product.tags || [],
          // SKU
          sku: product.sku || product._id?.substring(0, 8) || `SKU-${Math.random().toString(36).substr(2, 6)}`
        };
      });
      return transformedProducts;
      
    } catch (error: any) {
      console.error('Error searching products:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to search products');
      return [];
    }
  },

  // Get product by ID
  async getProductById(id: string) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }
};

// Category service - SIMPLIFIED
export const categoryService = {
  // Get all categories
  async getCategories() {
    try {
      const response = await api.get('/categories');      
      let categories = [];
      
      // Handle different response structures
      if (response.data.categories && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      } else if (response.data.data?.categories && Array.isArray(response.data.data.categories)) {
        categories = response.data.data.categories;
      } else if (Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      }
          const transformedCategories = categories.map((cat: any) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || '',
        image: cat.image || {}
      }));
      
      return transformedCategories;
      
    } catch (error: any) {
      console.error('Error loading categories:', {
        message: error.message,
        response: error.response?.data
      });
      toast.error('Failed to load categories');
      return [];
    }
  },

  // Get category by slug
  async getCategoryBySlug(slug: string) {
    try {
      const response = await api.get(`/categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error getting category:', error);
      return null;
    }
  }
};
