import React from 'react';
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { Package, Flame, BarChart3, AlertTriangle } from 'lucide-react';
import { baseURL } from '../../config/config';

interface ProductAnalyticsProps {
  data?: any;
  loading?: boolean;
}

const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ data, loading = false }) => {
  const BACKEND_URL = process.env.REACT_APP_API_URL || baseURL;
  
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) {
      return `${BACKEND_URL}${imagePath}`;
    }
    return imagePath;
  };

  if (loading) {
    return (
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div
        className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6 shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Product Analytics
          </h3>
        </div>
        <div className="py-10 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto opacity-40 mb-2" />
          <p>No product data available</p>
        </div>
      </motion.div>
    );
  }

  const topSelling = data?.topSelling || [];
  const lowStock = data?.lowStock || [];
  const categoryPerformance = data?.categoryPerformance || [];

  // Truncate long category names for chart
  const categoryLabels = categoryPerformance.map((c: any) => {
    const name = c.category || 'Unknown';
    return name.length > 12 ? name.substring(0, 10) + '...' : name;
  });
  
  const categoryRevenue = categoryPerformance.map((c: any) => c.revenue || 0);

  const categoryChart = {
    chart: { 
      type: "bar", 
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      height: 'auto' // Make height responsive
    },
    xaxis: { 
      categories: categoryLabels,
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500
        },
        rotate: -45,
        hideOverlappingLabels: true,
        trim: true
      }
    },
    colors: ['#6366F1'],
    plotOptions: {
      bar: { 
        borderRadius: 6, 
        columnWidth: "45%",
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -5,
      formatter: (val: number) => `₹${(val/1000).toFixed(0)}k`,
      style: {
        fontSize: '10px',
        fontWeight: 500
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `₹${(val/1000).toFixed(0)}k`,
        style: {
          fontSize: '11px'
        }
      },
      max: (max: number) => Math.max(max * 1.1, 100000) // Add padding
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₹${val?.toLocaleString() || 0}`
      }
    },
    responsive: [{
      breakpoint: 640,
      options: {
        plotOptions: {
          bar: {
            columnWidth: '60%'
          }
        },
        dataLabels: {
          enabled: false
        }
      }
    }]
  };

  const hasRevenueData = categoryRevenue.some((revenue: number) => revenue > 0);

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6 shadow-lg"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-green-600" />
          Product Analytics
        </h3>
        <div className="text-sm text-gray-600">
          Total Products: <span className="font-semibold">{data?.totalProducts || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Top Selling Products - FIXED */}
        <motion.div
          className="bg-gradient-to-br from-green-50 to-green-100/40 rounded-xl p-5 border border-green-200/40 shadow-sm"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Best Sellers
          </h4>

          {topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.slice(0, 4).map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/60 transition bg-white/50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg shadow bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img
                          src={getImageUrl(p.image)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate text-sm">
                        {p.name || 'Unknown Product'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{p.sales || 0} sales</span>
                        <span className="text-gray-400">•</span>
                        <span>Stock: {p.stock || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-semibold text-green-700 text-sm">
                      ₹{(p.revenue || 0)?.toLocaleString('en-IN')}
                    </p>
                    {p.revenue === 0 && p.sales > 0 && (
                      <div className="text-xs text-orange-600 mt-0.5">
                        Revenue missing
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <Flame className="w-10 h-10 mx-auto opacity-40 mb-2" />
              <p className="text-sm">No best sellers data</p>
            </div>
          )}
        </motion.div>

        {/* Category Performance Chart - FIXED */}
        <motion.div
          className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 rounded-xl p-5 border border-indigo-200/40 shadow-sm"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Category Performance
            </h4>
            {hasRevenueData && (
              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                Total: ₹{categoryRevenue.reduce((a: number, b: number) => a + b, 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {categoryLabels.length > 0 && hasRevenueData ? (
            <div>
              <div className="h-[240px] sm:h-[280px] -mx-2">
                <ReactApexChart
                  type="bar"
                  height="100%"
                  options={categoryChart}
                  series={[{ name: "Revenue", data: categoryRevenue }]}
                />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {categoryPerformance.slice(0, 4).map((cat: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-indigo-50/50 rounded">
                    <span className="truncate font-medium text-gray-700">
                      {cat.category?.length > 15 ? cat.category.substring(0, 13) + '...' : cat.category || 'Unknown'}
                    </span>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-semibold text-indigo-700">
                        ₹{(cat.revenue || 0)?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cat.sales || 0} sales
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <BarChart3 className="w-10 h-10 mx-auto opacity-40 mb-2" />
              {categoryLabels.length > 0 ? (
                <div>
                  <p className="text-sm mb-3">Category data available but revenue is 0</p>
                  <div className="mt-4 text-sm max-h-40 overflow-y-auto">
                    {categoryPerformance.map((cat: any, idx: number) => (
                      <div key={idx} className="flex justify-between mb-2 p-2 bg-gray-50 rounded">
                        <span className="truncate">{cat.category || 'Unknown'}:</span>
                        <span className="font-medium ml-2">{cat.sales || 0} sales</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm">No category performance data</p>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* Low Stock Alert - FIXED */}
      {lowStock.length > 0 && (
        <motion.div
          className="mt-8 bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="font-semibold text-red-700">Low Stock Alerts</p>
            </div>
            <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-lg">
              {data?.lowStockItems || 0} items low in stock
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStock.slice(0, 4).map((p: any, i: number) => (
              <div key={i} className="bg-white/80 p-3 rounded-lg border border-red-100 hover:bg-white transition">
                <div className="flex items-center gap-3 mb-2">
                  {p.image && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="font-medium text-gray-800 truncate text-sm flex-1">
                    {p.name || 'Unknown Product'}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 truncate">
                    {p.category || 'Uncategorized'}
                  </span>
                  <span className="text-red-700 font-semibold text-xs whitespace-nowrap ml-2">
                    {p.stock || 0} left
                  </span>
                </div>
                <div className="text-xs text-red-600 mt-1 font-medium">
                  (min: {p.minStock || 10})
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductAnalytics;