// src/components/user/orders/OrderTracking.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../admin/services/orderService';
import { Order } from '../admin/types/order';

const OrderTracking: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchOrderTracking = async () => {
    if (!orderNumber) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await orderService.trackOrder(orderNumber);
      setOrder(response.data.order);
    } catch (error: any) {
      console.error('Error fetching order tracking:', error);
      setError(error.response?.data?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderTracking();
  }, [orderNumber]);

  const getStatusSteps = () => {
    const steps = [
      { status: 'pending', label: 'Order Placed', description: 'Your order has been received' },
      { status: 'confirmed', label: 'Order Confirmed', description: 'Payment confirmed and order processing' },
      { status: 'processing', label: 'Processing', description: 'Preparing your order for shipment' },
      { status: 'shipped', label: 'Shipped', description: 'Your order is on the way' },
      { status: 'delivered', label: 'Delivered', description: 'Order successfully delivered' }
    ];

    return steps.map(step => ({
      ...step,
      completed: getStepCompletion(step.status),
      current: getCurrentStep(step.status)
    }));
  };

  const getStepCompletion = (stepStatus: string) => {
    if (!order) return false;
    
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    return stepIndex <= currentIndex;
  };

  const getCurrentStep = (stepStatus: string) => {
    return order && order.status === stepStatus;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709V14a5 5 0 0110 0v4.291z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't find an order with that tracking number."}
          </p>
          <div className="space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
        <p className="text-gray-600 mt-2">
          Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">Current Status</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{order.status}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Estimated Delivery</p>
            <p className="text-lg font-semibold text-gray-900">
              {order.estimatedDelivery 
                ? new Date(order.estimatedDelivery).toLocaleDateString()
                : 'Calculating...'
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Tracking Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {order.shippingMethod?.trackingNumber || 'Not available'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h3>
          <div className="space-y-4">
            {statusSteps.map((step, index) => (
              <div key={step.status} className="flex items-start space-x-4">
                {/* Step Indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-600 text-white' 
                      : step.current
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.completed ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-12 ${
                      step.completed ? 'bg-green-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-8">
                  <div className={`${step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    <p className="font-medium">{step.label}</p>
                    <p className="text-sm mt-1">{step.description}</p>
                    
                    {/* Show additional info for current/active steps */}
                    {step.current && step.status === 'shipped' && order.shippingMethod?.trackingNumber && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <strong>Tracking:</strong> {order.shippingMethod.trackingNumber}
                        </p>
                        {order.shippingMethod.carrier && (
                          <p className="text-sm text-blue-600">
                            <strong>Carrier:</strong> {order.shippingMethod.carrier}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {step.current && step.status === 'delivered' && order.deliveredAt && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        <p className="text-sm text-green-700">
                          Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Events */}
        {order.shippingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Updates</h3>
            <div className="space-y-3">
              {order.shippingEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.event}</p>
                    {event.description && (
                      <p className="text-sm text-gray-600">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="text-xs text-gray-500">Location: {event.location}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need Help with Your Order?</h4>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your order or delivery, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="mailto:support@yourstore.com"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Email Support
            </a>
            <a
              href="tel:+911234567890"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;