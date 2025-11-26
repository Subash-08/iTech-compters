// src/components/admin/orders/OrderSummary.tsx

import React from 'react';
import { Order } from '../types/order';
import StatusBadge from './StatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Order Number</dt>
                <dd className="text-sm font-medium text-gray-900">#{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Order Date</dt>
                <dd className="text-sm text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Order Status</dt>
                <dd className="text-sm">
                  <StatusBadge status={order.status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Payment Status</dt>
                <dd className="text-sm">
                  <PaymentStatusBadge status={order.payment.status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Source</dt>
                <dd className="text-sm text-gray-900 capitalize">{order.source}</dd>
              </div>
              {order.deliveredAt && (
                <div>
                  <dt className="text-sm text-gray-500">Delivered At</dt>
                  <dd className="text-sm text-gray-900">{formatDate(order.deliveredAt.toString())}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Payment Method</dt>
                <dd className="text-sm text-gray-900 capitalize">
                  {order.payment.method}
                </dd>
              </div>
              {order.payment.attempts.length > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Last Transaction ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {order.payment.attempts[0].razorpayPaymentId || 'N/A'}
                  </dd>
                </div>
              )}
              {order.coupon && (
                <div>
                  <dt className="text-sm text-gray-500">Coupon Applied</dt>
                  <dd className="text-sm text-gray-900">
                    {order.coupon.code} ({order.coupon.discountType === 'percentage' ? `${order.coupon.discountAmount}%` : formatCurrency(order.coupon.discountAmount)})
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Amount Paid</dt>
                <dd className="text-sm font-medium text-green-600">
                  {formatCurrency(order.pricing.amountPaid, order.pricing.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Shipping Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Shipping Information</h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Shipping Method</dt>
                <dd className="text-sm text-gray-900">
                  {order.shippingMethod.name}
                </dd>
              </div>
              {order.shippingMethod.trackingNumber && (
                <div>
                  <dt className="text-sm text-gray-500">Tracking Number</dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    {order.shippingMethod.trackingNumber}
                  </dd>
                </div>
              )}
              {order.shippingMethod.carrier && (
                <div>
                  <dt className="text-sm text-gray-500">Carrier</dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {order.shippingMethod.carrier}
                  </dd>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <dt className="text-sm text-gray-500">Estimated Delivery</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(order.estimatedDelivery.toString())}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Shipping Cost</dt>
                <dd className="text-sm text-gray-900">
                  {formatCurrency(order.shippingMethod.cost, order.pricing.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Risk Assessment */}
          {(order.fraudScore > 0 || order.riskFlags.length > 0) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Assessment</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-500">Fraud Score</dt>
                  <dd className={`text-sm font-medium ${
                    order.fraudScore > 70 ? 'text-red-600' : 
                    order.fraudScore > 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {order.fraudScore}/100
                  </dd>
                </div>
                {order.riskFlags.length > 0 && (
                  <div>
                    <dt className="text-sm text-gray-500">Risk Flags</dt>
                    <dd className="text-sm">
                      {order.riskFlags.map(flag => (
                        <span
                          key={flag}
                          className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                        >
                          {flag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;