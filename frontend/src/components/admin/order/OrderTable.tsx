// src/components/admin/orders/OrderTable.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '../types/order';
import StatusBadge from './StatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  onPageChange: (page: number) => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading,
  pagination,
  onPageChange,
  onStatusUpdate
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

    const handleNextPage = () => {
    const nextPage = Number(pagination.currentPage) + 1;
    onPageChange(nextPage);
  };

  const handlePrevPage = () => {
    const prevPage = Number(pagination.currentPage) - 1;
    onPageChange(prevPage);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ✅ FIX: Show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Show empty state when no orders
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <p className="text-gray-500 text-lg mb-2">No orders found</p>
        <p className="text-gray-400 text-sm">
          {pagination.total > 0 
            ? "No orders match your current filters. Try adjusting your search criteria."
            : "No orders have been placed yet."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      #{order.orderNumber}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.shippingAddress.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(order.pricing.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentStatusBadge status={order.payment.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/admin/orders/${order._id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </Link>
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => onStatusUpdate(order._id, 'shipped')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Ship
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

 {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="text-sm text-gray-700">
              Showing {orders.length} of {pagination.total} orders
              {pagination.totalPages > 1 && (
                <span> (Page {pagination.currentPage} of {pagination.totalPages})</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 border text-sm font-medium rounded-md transition-colors ${
                        pagination.currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;