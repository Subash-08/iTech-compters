import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { dashboardService } from '../services/dashboardService';
import { TrendingUp, CreditCard, Calendar } from 'lucide-react';

interface SalesChartsProps {
  period?: string;
  data?: any;
  loading?: boolean;
}

const SalesCharts: React.FC<SalesChartsProps> = ({ period = '30d', data, loading: propLoading }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localPeriod, setLocalPeriod] = useState<string>(period);

  const isLoading = propLoading !== undefined ? propLoading : localLoading;

  useEffect(() => {
    // If data is passed as prop, use it
    if (data) {
      setChartData(data);
      setLocalLoading(false);
    } else {
      // Otherwise fetch it
      const fetchChartData = async () => {
        try {
          setLocalLoading(true);
          const response = await dashboardService.getSalesChartData({ period: localPeriod });
          setChartData(response.data);
        } catch (error) {
          console.error('Error fetching chart data:', error);
          // Set fallback empty data to prevent crashes
          setChartData({
            dailyRevenue: [],
            paymentMethods: [],
            ordersTrend: []
          });
        } finally {
          setLocalLoading(false);
        }
      };

      fetchChartData();
    }
  }, [localPeriod, data]);

  // Safe data access with fallbacks
  const dailyRevenueData = chartData?.dailyRevenue || [];
  const paymentMethodsData = chartData?.paymentMethods || [];
  const ordersTrendData = chartData?.ordersTrend || [];

  if (isLoading) {
    return (
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Don't render charts if no data
  if (!chartData) {
    return (
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6">
        <div className="text-center py-10 text-gray-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Analytics</h3>
          <p>No sales data available</p>
        </div>
      </div>
    );
  }

  // Chart configurations with safe data access
  const dailyRevenueChart = {
    series: [
      {
        name: 'Revenue',
        data: dailyRevenueData.map((d: any) => d.revenue || 0)
      }
    ],
    options: {
      chart: {
        type: 'area',
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#4F46E5'],
      fill: {
        type: 'gradient',
        gradient: { 
          shadeIntensity: 0.6, 
          opacityFrom: 0.5, 
          opacityTo: 0.0,
          stops: [0, 90, 100]
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: {
        categories: dailyRevenueData.map((d: any) => d.date || ''),
        type: 'datetime'
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `₹${(value / 1000).toFixed(0)}k`
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (value: number) => `₹${value?.toLocaleString() || 0}`
        }
      }
    }
  };

  const paymentMethodsChart = {
    series: paymentMethodsData.map((m: any) => m.count || 0),
    options: {
      chart: { 
        type: 'donut', 
        toolbar: { show: false } 
      },
      labels: paymentMethodsData.map((m: any) => {
        const method = m.method === 'razorpay' ? 'Online Payment' : 
                      m.method === 'cod' ? 'Cash on Delivery' : 
                      m.method || 'Unknown';
        return method;
      }),
      colors: ['#16A34A', '#0284C7', '#9333EA', '#EA580C', '#2563EB'],
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Payments',
                formatter: () => {
                  const total = paymentMethodsData.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
                  return total.toString();
                }
              }
            }
          }
        }
      }
    }
  };

  const monthlyTrendChart = {
    series: [
      {
        name: 'Orders Completed',
        data: ordersTrendData.map((d: any) => d.completed || 0)
      }
    ],
    options: {
      chart: { 
        type: 'line', 
        toolbar: { show: false } 
      },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#9333EA'],
      xaxis: {
        categories: ordersTrendData.map((d: any) => d.date || ''),
        type: 'datetime'
      },
      yaxis: {
        title: {
          text: 'Orders Completed'
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (value: number) => `${value || 0} orders`
        }
      }
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setLocalPeriod(newPeriod);
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              localPeriod === '30d' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => handlePeriodChange('30d')}
          >
            30 Days
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              localPeriod === '90d' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => handlePeriodChange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Revenue */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-blue-800">Daily Revenue</h4>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          {dailyRevenueData.length > 0 ? (
            <ReactApexChart
              options={dailyRevenueChart.options}
              series={dailyRevenueChart.series}
              type="area"
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-green-800">Payment Methods</h4>
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          {paymentMethodsData.length > 0 ? (
            <ReactApexChart
              options={paymentMethodsChart.options}
              series={paymentMethodsChart.series}
              type="donut"
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No payment data available
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-purple-800">Orders Completion Trend</h4>
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        {ordersTrendData.length > 0 ? (
          <ReactApexChart
            options={monthlyTrendChart.options}
            series={monthlyTrendChart.series}
            type="line"
            height={250}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No order trend data available
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesCharts;