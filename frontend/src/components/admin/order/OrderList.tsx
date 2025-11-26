// Update the OrderList component to include export functionality

import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { Order, OrderFilters } from '../types/order';
import OrderFiltersComponent from './OrderFilters';
import OrderTable from './OrderTable';
import OrderStats from './OrderStats';
import ExportOrders from './ExportOrders';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 10,
    status: '',
    paymentStatus: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
const fetchOrders = async () => {
  try {
    setLoading(true);
    const response = await orderService.getOrders(filters);
    
    // ✅ FIX: Convert API response values to numbers
    const currentPage = Number(response.data.currentPage);
    const totalPages = Number(response.data.totalPages);
    const total = Number(response.data.total);
  
    setOrders(response.data.orders);
    setPagination({
      currentPage: currentPage,
      totalPages: totalPages,
      total: total
    });
    setStats(response.data.stats);
    
    // ✅ FIX: Use converted numbers for comparison
    if (currentPage > totalPages && totalPages > 0) {
      console.warn(`Page ${currentPage} exceeds total pages (${totalPages}). Resetting to page 1.`);
      setFilters(prev => ({ ...prev, page: 1 }));
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    setFilters(prev => ({ ...prev, page: 1 }));
  } finally {
    setLoading(false);
  }
};

// ✅ FIX: Enhanced handlePageChange with better logging
const handlePageChange = (page: number | string) => {
  const pageNum = Number(page);
 
  if (pageNum >= 1 && pageNum <= pagination.totalPages) {
    setFilters(prev => ({ ...prev, page: pageNum }));
  } else {
  }
};

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };



  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order._id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  // ✅ FIX: Add a refresh function that resets to page 1
  const handleRefresh = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExport(!showExport)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {showExport ? 'Hide Export' : 'Export Orders'}
          </button>
        </div>
      </div>

      {showExport && <ExportOrders filters={filters} />}

      <OrderStats stats={stats} />
      
      <OrderFiltersComponent 
        filters={filters} 
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh} // ✅ Use the fixed refresh function
      />
      
      <OrderTable
        orders={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default OrderList;