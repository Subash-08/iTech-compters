export interface QuickStats {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  verifiedUsers: number;
  totalProducts: number;
  lowStockItems: number;
  totalQuotes: number;
  pendingQuotes: number;
  prebuiltPCsPublished: number;
  totalCoupons: number;
  activeCoupons: number;
}

export interface SalesChartData {
  period: string;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  ordersTrend: Array<{
    date: string;
    total: number;
    completed: number;
  }>;
}

export interface ProductAnalytics {
  period: string;
  totalProducts: number;
  lowStockItems: number;
  activeProducts: number;
  topSelling: Array<{
    id: string;
    name: string;
    image: string;
    sales: number;
    revenue: number;
    stock: number;
    category: string;
    brand: string;
  }>;
  categoryPerformance: Array<{
    category: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
}

export interface UserAnalytics {
  period: string;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersWithOrders: number;
  returningRate: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

export interface PCAnalytics {
  period: string;
  totalQuotes: number;
  approvedQuotes: number;
  expiredQuotes: number;
  pendingQuotes: number;
  conversionRate: number;
  topComponents: Array<{
    component: string;
    category: string;
    count: number;
  }>;
  weeklyQuotes: Array<{
    week: string;
    quotes: number;
    conversions: number;
  }>;
}

export interface CouponAnalytics {
  period: string;
  totalCoupons: number;
  activeCoupons: number;
  totalUsage: number;
  discountGiven: number;
  mostUsed: {
    code: string;
    usageCount: number;
    discountAmount: number;
  } | null;
  performance: Array<{
    code: string;
    usage: number;
    revenue: number;
    successRate: number;
  }>;
  timeline: Array<{
    date: string;
    usage: number;
    revenue: number;
  }>;
}


export interface AlertItem {
  id: string;
  type: 'order' | 'payment' | 'stock' | 'invoice' | 'quote' | 'user';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionRequired: boolean;
}

export interface QuickStats {
  todayRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalProducts: number;
  lowStockItems: number;
  pcQuotesPending: number;
  prebuiltPCsPublished: number;
  couponsActive: number;
}