// src/components/user/orders/OrderList.tsx - Updated with pagination
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../admin/services/orderService';
import { Order } from '../admin/types/order';
import { getImageUrl } from '../utils/imageUtils';

interface OrdersResponse {
  orders: Order[];
  total: number;
  totalPages: number;
  currentPage: number;
}

const OrderList: React.FC = () => {
  const [ordersData, setOrdersData] = useState<OrdersResponse>({
    orders: [],
    total: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders(filters);
      setOrdersData(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters.page, filters.status, filters.sortBy, filters.sortOrder]);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { orders, total, totalPages, currentPage } = ordersData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-2">
          View your order history and track shipments ({total} orders found)
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * filters.limit + 1} - {Math.min(currentPage * filters.limit, total)} of {total} orders
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {filters.status ? `No ${filters.status} orders found.` : "You haven't placed any orders yet."}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Order Date:</span>
                          <br />
                          {formatDate(order.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span>
                          <br />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div>
                          <span className="font-medium">Total Amount:</span>
                          <br />
                          ₹{order.pricing.total.toFixed(2)}
                        </div>
                      </div>

    {/* Order Items Preview */}
<div className="mt-4 flex items-center space-x-2">
  {order.items.slice(0, 3).map((item, index) => (
    <div key={index} className="flex items-center space-x-2 text-sm text-gray-500">
      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
        {item.image ? (
          <img
            src={getImageUrl(item.image)} // ✅ Using utility function
            alt={item.name}
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <span className="text-xs">📦</span>
        )}
      </div>
      <span className="truncate max-w-[150px]">{item.quantity}x {item.name}</span>
      {index < Math.min(3, order.items.length) - 1 && (
        <span className="text-gray-300">•</span>
      )}
    </div>
  ))}
  {order.items.length > 3 && (
    <span className="text-sm text-gray-500 font-medium">
      +{order.items.length - 3} more
    </span>
  )}
</div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row lg:flex-col gap-2">
                      <Link
                        to={`/account/orders/${order._id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.shippingMethod?.trackingNumber && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Tracking: {order.shippingMethod.trackingNumber}
                          </p>
                          {order.shippingMethod.carrier && (
                            <p className="text-sm text-blue-600">
                              Carrier: {order.shippingMethod.carrier}
                            </p>
                          )}
                        </div>
                        {order.status === 'shipped' && (
                          <Link
                            to={`/orders/track/${order.orderNumber}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Track Order
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderList;