import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../admin/services/orderService';
import { Order, InvoiceResponse } from '../admin/types/order';
import { getImageUrl } from '../utils/imageUtils';
const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const [orderResponse, invoicesResponse] = await Promise.all([
        orderService.getUserOrderDetails(orderId),
        orderService.getUserOrderInvoices(orderId)
      ]);
      
      setOrder(orderResponse.data.order);
      setInvoices(invoicesResponse.data.invoices || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

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

  const handleDownload = async (invoiceType: 'auto' | 'admin', fileName: string) => {
    if (!orderId) return;
    
    try {
      const response = await orderService.downloadUserInvoice(orderId, invoiceType);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !order) return;
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await orderService.cancelOrder(orderId, reason);
      alert('Order cancellation request submitted successfully!');
      fetchOrderDetails(); // Refresh data
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link
            to="/account/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Order Overview' },
    { id: 'invoices', name: 'Invoices' },
    { id: 'timeline', name: 'Order Timeline' },
    { id: 'shipping', name: 'Shipping Info' }
  ];

  const hasAutoInvoice = invoices.some(inv => inv.type === 'auto_generated');
  const hasAdminInvoice = invoices.some(inv => inv.type === 'admin_uploaded');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/account/orders')}
          className="inline-flex items-center text-blue-600 hover:text-blue-900 mb-4 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            
            {/* Cancel Order Button */}
            {order.status === 'pending' && (
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border">
            {activeTab === 'overview' && (
              <div className="p-6">
                {/* Invoice Download Section - Moved to Overview */}
                {(hasAutoInvoice || hasAdminInvoice) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Invoices</h3>
                    <div className="flex flex-wrap gap-3">
                      {hasAutoInvoice && (
                        <button
                          onClick={() => handleDownload('auto', `invoice-${order.orderNumber}.pdf`)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download System Invoice
                        </button>
                      )}
                      {hasAdminInvoice && (
                        <button
                          onClick={() => handleDownload('admin', `admin-invoice-${order.orderNumber}.pdf`)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Custom Invoice
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)} // ✅ Using getImageUrl here
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            Variant: {item.variant.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ₹{((item.discountedPrice || item.price) * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ₹{item.discountedPrice?.toFixed(2) || item.price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {order.pricing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.pricing.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹{order.pricing.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>₹{order.pricing.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{order.pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Invoices</h3>
                {invoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No invoices available for this order.</p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.type === 'auto_generated' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {invoice.type === 'auto_generated' ? 'System Generated' : 'Custom Uploaded'}
                            </span>
                            <p className="font-medium">{invoice.title}</p>
                          </div>
                          <p className="text-sm text-gray-500">
                            Invoice #: {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.type === 'auto_generated' && invoice.generatedAt
                              ? `Generated: ${new Date(invoice.generatedAt).toLocaleDateString()}`
                              : invoice.uploadedAt
                              ? `Uploaded: ${new Date(invoice.uploadedAt).toLocaleDateString()}`
                              : ''
                            }
                          </p>
                          {invoice.notes && (
                            <p className="text-sm text-gray-600 mt-1">{invoice.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDownload(
                            invoice.type === 'auto_generated' ? 'auto' : 'admin',
                            `invoice-${order.orderNumber}.pdf`
                          )}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  {order.orderTimeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.changedAt).toLocaleString()}
                        </p>
                        {event.changedBy && (
                          <p className="text-xs text-gray-400">
                            By: {event.changedBy.firstName} {event.changedBy.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                    <address className="not-italic text-gray-600">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                      {order.shippingAddress.address}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                      {order.shippingAddress.country}
                      {order.shippingAddress.phone && (
                        <>
                          <br />
                          <strong>Phone:</strong> {order.shippingAddress.phone}
                        </>
                      )}
                    </address>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Shipping Method</h4>
                    <p className="text-gray-600">{order.shippingMethod.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Estimated delivery: {order.estimatedDelivery 
                        ? new Date(order.estimatedDelivery).toLocaleDateString()
                        : 'Calculating...'
                      }
                    </p>
                    
                    {order.shippingMethod.trackingNumber && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-800">
                          Tracking Number: {order.shippingMethod.trackingNumber}
                        </p>
                        {order.shippingMethod.carrier && (
                          <p className="text-sm text-blue-600">
                            Carrier: {order.shippingMethod.carrier}
                          </p>
                        )}
                        <Link
                          to={`/orders/track/${order.orderNumber}`}
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Track Your Order →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Events */}
                {order.shippingEvents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Shipping Updates</h4>
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
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total</span>
                <span className="font-semibold">₹{order.pricing.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  order.payment.status === 'captured' 
                    ? 'bg-green-100 text-green-800'
                    : order.payment.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium capitalize">{order.payment.method}</span>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your order, our support team is here to help.
            </p>
            <div className="space-y-2">
              <a
                href="mailto:support@yourstore.com"
                className="block text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </a>
              <Link
                to="/help/orders"
                className="block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Order Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;