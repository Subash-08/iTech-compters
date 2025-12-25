import React, { useState, useEffect } from 'react';
import { Card, Statistic, Segmented, Button, Space, Tag } from 'antd';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  RefreshCw
} from 'lucide-react';
import CountUp from 'react-countup';
import { toast } from 'react-hot-toast';
import { dashboardService } from '../services/dashboardService';
import { 
  QuickStats, 
  SalesChartData, 
  ProductAnalytics as ProductAnalyticsType,
  UserAnalytics as UserAnalyticsType,
  PCAnalytics as PCAnalyticsType,
  CouponAnalytics as CouponAnalyticsType 
} from '../types/dashboard';

// Import all components
import SalesCharts from './SalesCharts';
import ProductAnalytics from './ProductAnalytics';
import UserInsights from './UserInsights';
import PCAnalytics from './PCAnalytics';
import CouponAnalytics from './CouponAnalytics';

// Interface for order stats response
interface OrderStatsResponse {
  todayRevenue: number;
  todayOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  processingOrders: number;
  shippedOrders: number;
}

const Dashboard: React.FC = () => {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatsResponse | null>(null);
  const [salesChartData, setSalesChartData] = useState<SalesChartData | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalyticsType | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsType | null>(null);
  const [pcAnalytics, setPCAnalytics] = useState<PCAnalyticsType | null>(null);
  const [couponAnalytics, setCouponAnalytics] = useState<CouponAnalyticsType | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<string>('30d');


  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      // Fetch all analytics data in parallel
      const [
        quickStatsRes,
        orderStatsRes,
        salesChartRes,
        productAnalyticsRes,
        userAnalyticsRes,
        pcAnalyticsRes,
        couponAnalyticsRes
      ] = await Promise.all([
        dashboardService.getQuickStats({ period }),
        dashboardService.getOrderStats(),
        dashboardService.getSalesChartData({ period }),
        dashboardService.getProductAnalytics({ period }),
        dashboardService.getUserAnalytics({ period }),
        dashboardService.getPCAnalytics({ period }),
        dashboardService.getCouponAnalytics({ period })
      ]);

      // Set all states
      setQuickStats(quickStatsRes.data);
      setOrderStats(orderStatsRes.data);
      setSalesChartData(salesChartRes.data);
      setProductAnalytics(productAnalyticsRes.data);
      setUserAnalytics(userAnalyticsRes.data);
      setPCAnalytics(pcAnalyticsRes.data);
      setCouponAnalytics(couponAnalyticsRes.data);
      
      toast.success('Dashboard updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('Dashboard fetch error:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow-sm"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <div className="h-96 bg-white rounded-xl shadow-sm"></div>
                <div className="h-64 bg-white rounded-xl shadow-sm"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-white rounded-xl shadow-sm"></div>
                <div className="h-64 bg-white rounded-xl shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Business insights and analytics</p>
          </div>
          
          <Space size="middle" className="flex flex-col sm:flex-row gap-3">
            <Segmented
              options={[
                { label: 'Today', value: 'today' },
                { label: '7D', value: '7d' },
                { label: '30D', value: '30d' },
                { label: '90D', value: '90d' },
                { label: 'Lifetime', value: 'lifetime' },
              ]}
              value={period}
              onChange={handlePeriodChange}
              size="large"
            />
            
            <Button
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              onClick={handleRefresh}
              loading={refreshing}
              type="primary"
              size="large"
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <Card className="shadow-lg border-0">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Revenue ({period})</span>
                </div>
              }
              value={quickStats?.revenue || 0}
              formatter={(value) => (
                <CountUp
                  end={Number(value) || 0}
                  duration={2.5}
                  separator=","
                  prefix="₹"
                  decimals={0}
                />
              )}
              valueStyle={{ color: '#10B981' }}
            />
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Average Order:</span>
                <span className="font-semibold text-green-600">
                  ₹{(quickStats?.averageOrderValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Today:</span>
                <span className="font-semibold text-blue-600">
                  ₹{(orderStats?.todayRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Card>

          {/* Orders Card */}
          <Card className="shadow-lg border-0">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Orders ({period})</span>
                </div>
              }
              value={quickStats?.orders || 0}
              formatter={(value) => (
                <CountUp
                  end={Number(value) || 0}
                  duration={2.5}
                  separator=","
                />
              )}
              valueStyle={{ color: '#3B82F6' }}
            />
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-700">{orderStats?.processingOrders || 0}</div>
                <div className="text-blue-600">Processing</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-700">{orderStats?.shippedOrders || 0}</div>
                <div className="text-orange-600">Shipped</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-700">{orderStats?.cancelledOrders || 0}</div>
                <div className="text-red-600">Cancelled</div>
              </div>
            </div>
          </Card>

          {/* Users Card */}
          <Card className="shadow-lg border-0">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </div>
              }
              value={quickStats?.totalUsers || 0}
              formatter={(value) => (
                <CountUp
                  end={Number(value) || 0}
                  duration={2.5}
                  separator=","
                />
              )}
              valueStyle={{ color: '#8B5CF6' }}
            />
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-semibold text-green-600">{quickStats?.activeUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Verified Users:</span>
                <span className="font-semibold text-blue-600">{quickStats?.verifiedUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>New Users ({period}):</span>
                <span className="font-semibold text-purple-600">{quickStats?.newUsers || 0}</span>
              </div>
            </div>
          </Card>

          {/* Products Card */}
          <Card className="shadow-lg border-0">
            <Statistic
              title={
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Package className="w-4 h-4" />
                  <span>Products</span>
                </div>
              }
              value={quickStats?.totalProducts || 0}
              formatter={(value) => (
                <CountUp
                  end={Number(value) || 0}
                  duration={2.5}
                  separator=","
                />
              )}
              valueStyle={{ color: '#F59E0B' }}
            />
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Low Stock:</span>
                <span className="font-semibold text-red-600">{quickStats?.lowStockItems || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pre-built PCs:</span>
                <span className="font-semibold text-indigo-600">{quickStats?.prebuiltPCsPublished || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Coupons:</span>
                <span className="font-semibold text-green-600">{quickStats?.activeCoupons || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* All Components Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Charts & Analytics */}
          <div className="xl:col-span-2 space-y-8">
            <SalesCharts 
              period={period} 
              data={salesChartData}
              loading={loading}
            />
            <ProductAnalytics 
              data={productAnalytics}
              loading={loading}
            />
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-8">
            <UserInsights 
              data={userAnalytics}
              loading={loading}
            />
            <PCAnalytics 
              data={pcAnalytics}
              loading={loading}
            />
            <CouponAnalytics 
              data={couponAnalytics}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;