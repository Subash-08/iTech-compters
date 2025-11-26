import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { dashboardService } from '../services/dashboardService';
import { Package, Flame, BarChart3, AlertTriangle } from 'lucide-react';

const ProductAnalytics: React.FC = () => {
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await dashboardService.getProductAnalytics();
        setProductData(response.data);
      } catch (error) {
        console.error('Error fetching product data:', error);
        setProductData({
          topSelling: [],
          lowStock: [],
          categoryPerformance: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Category chart data
  const categoryLabels = productData?.categoryPerformance?.map((c: any) => c.category) || [];
  const categorySeries = productData?.categoryPerformance?.map((c: any) => c.totalReviews) || [];

  const categoryChart = {
    chart: { type: "bar", toolbar: { show: false } },
    xaxis: { categories: categoryLabels },
    colors: ['#6366F1'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "45%" }
    }
  };

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Top Selling Products */}
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

          {productData?.topSelling?.length ? (
            <div className="space-y-4">
              {productData.topSelling.slice(0, 4).map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/60 transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={p.image}
                      className="w-12 h-12 rounded-xl object-cover shadow"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.sales} sales</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-green-700">
                      ₹{p.revenue?.toLocaleString()}
                    </p>
                    <p
                      className={`text-xs ${
                        p.stock < 10 ? "text-red-600 font-bold" : "text-gray-500"
                      }`}
                    >
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto opacity-40 mb-2" />
              No product data
            </div>
          )}
        </motion.div>

        {/* Category Performance Chart */}
        <motion.div
          className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 rounded-xl p-5 border border-indigo-200/40 shadow-sm"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Category Performance
          </h4>

          {categoryLabels.length > 0 ? (
            <ReactApexChart
              type="bar"
              height={260}
              options={categoryChart}
              series={[{ name: "Reviews", data: categorySeries }]}
            />
          ) : (
            <div className="py-10 text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto opacity-40 mb-2" />
              No category data
            </div>
          )}
        </motion.div>

      </div>

      {/* Low Stock Alert */}
      {productData?.lowStock?.length > 0 && (
        <motion.div
          className="mt-8 bg-red-50 p-5 rounded-xl border border-red-200 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="font-semibold text-red-700">Low Stock Alerts</p>
          </div>

          <div className="space-y-2">
            {productData.lowStock.slice(0, 4).map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <p>{p.name}</p>
                <span className="text-red-700 font-semibold">{p.stock} left</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductAnalytics;
