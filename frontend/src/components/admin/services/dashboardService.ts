import api from '../../config/axiosConfig';
import { 
  OrderStats, 
  SalesChartData, 
  ProductAnalytics, 
  UserAnalytics,
  PCAnalytics,
  CouponAnalytics,
  QuickStats,
  AlertItem 
} from '../types/dashboard';

export const dashboardService = {
  // Get order statistics
  async getOrderStats(): Promise<{ data: OrderStats }> {
    const response = await api.get('/admin/orders/analytics/enhanced');
    return response.data;
  },

  // Get quick stats with time period support
  async getQuickStats(params?: { period?: string }): Promise<{ data: QuickStats }> {
    const response = await api.get('/admin/analytics/quick-stats', { params });
    return response.data;
  },

  // Get sales chart data with time period support
  async getSalesChartData(params?: { period?: string }): Promise<{ data: SalesChartData }> {
    const response = await api.get('/admin/analytics/sales-chart', { params });
    return response.data;
  },

  // Get product analytics with time period support
  async getProductAnalytics(params?: { period?: string }): Promise<{ data: ProductAnalytics }> {
    const response = await api.get('/admin/analytics/products', { params });
    return response.data;
  },

  // Get user analytics with time period support
  async getUserAnalytics(params?: { period?: string }): Promise<{ data: UserAnalytics }> {
    const response = await api.get('/admin/analytics/users', { params });
    return response.data;
  },

  // Get PC builder analytics with time period support
  async getPCAnalytics(params?: { period?: string }): Promise<{ data: PCAnalytics }> {
    const response = await api.get('/admin/analytics/pc-builder', { params });
    return response.data;
  },

  // Get coupon analytics with time period support
  async getCouponAnalytics(params?: { period?: string }): Promise<{ data: CouponAnalytics }> {
    const response = await api.get('/admin/analytics/coupons', { params });
    return response.data;
  },

  // Get pre-built PC analytics
  async getPreBuiltPCAnalytics(): Promise<{ data: any }> {
    const response = await api.get('/admin/analytics/prebuilt-pcs');
    return response.data;
  },


};