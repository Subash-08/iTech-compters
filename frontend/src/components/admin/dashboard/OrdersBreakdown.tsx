import React from 'react';
import ReactApexChart from "react-apexcharts";
import { motion } from "framer-motion";
import { PieChart, BarChart3, ClipboardList } from 'lucide-react';

interface OrdersBreakdownProps {
  orderStats?: any;
  quickStats?: any;
  loading?: boolean;
}

const OrdersBreakdown: React.FC<OrdersBreakdownProps> = ({ 
  orderStats, 
  quickStats,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Safe data access with fallbacks
  const totalOrders = orderStats?.totalOrders || 1;
  const todayOrders = orderStats?.todayOrders || 0;
  const monthlyOrders = orderStats?.monthlyOrders || 0;
  const deliveredOrders = orderStats?.deliveredOrders || 0;
  const averageOrderValue = quickStats?.averageOrderValue || 0;

  const statusList = [
    { key: "pending", label: "Pending", color: "#FBBF24" },
    { key: "processing", label: "Processing", color: "#3B82F6" },
    { key: "shipped", label: "Shipped", color: "#6366F1" },
    { key: "delivered", label: "Delivered", color: "#22C55E" },
    { key: "cancelled", label: "Cancelled", color: "#EF4444" }
  ];

  // Get status counts with fallbacks
  const donutSeries = statusList.map(s => orderStats?.[`${s.key}Orders`] || 0);
  const donutLabels = statusList.map(s => s.label);
  const donutColors = statusList.map(s => s.color);

  const donutOptions = {
    chart: { 
      type: "donut",
      toolbar: { show: false }
    },
    labels: donutLabels,
    colors: donutColors,
    stroke: { width: 2 },
    legend: { 
      position: "bottom",
      fontSize: '12px'
    },
    dataLabels: { 
      enabled: true,
      formatter: (val: number) => `${val?.toFixed(1) || 0}%`,
      style: {
        fontSize: '11px'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Orders",
              formatter: () => totalOrders.toString()
            }
          }
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} orders`
      }
    }
  };

  const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

  return (
    <motion.div 
      className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6 shadow-lg"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-gray-700" />
          Orders Breakdown
        </h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{totalOrders}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Donut Chart */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-indigo-900 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Status Distribution
            </h4>
          </div>

          {donutSeries.some(val => val > 0) ? (
            <ReactApexChart
              options={donutOptions}
              series={donutSeries}
              type="donut"
              height={260}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No order data available
            </div>
          )}
        </div>

        {/* Metrics */}
        <motion.div 
          className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-xl p-4 border border-orange-200/40 shadow-sm"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-medium text-orange-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Key Metrics
          </h4>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-semibold text-orange-800">
                ₹{averageOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Success Rate</span>
              <span className={`font-semibold ${successRate >= 80 ? 'text-green-700' : 'text-yellow-600'}`}>
                {successRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Orders</span>
              <span className="font-semibold text-blue-700">
                {todayOrders}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Orders</span>
              <span className="font-semibold text-purple-700">
                {monthlyOrders}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivered Orders</span>
              <span className="font-semibold text-green-700">
                {deliveredOrders}
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default OrdersBreakdown;