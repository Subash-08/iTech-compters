// src/components/admin/orders/OrderDetails.tsx - Updated
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Order, OrderStatusUpdateData, ShippingUpdateData, AdminNoteFormData } from '../types/order';
import OrderSummary from './OrderSummary';
import OrderItems from './OrderItems';
import OrderTimeline from './OrderTimeline';
import AdminNotes from './AdminNotes';
import StatusUpdateForm from './StatusUpdateForm';
import ShippingUpdateForm from './ShippingUpdateForm';
import PaymentStatusBadge from './PaymentStatusBadge';
import StatusBadge from './StatusBadge';
import ShippingStatusBadge from './ShippingStatusBadge';
import InvoiceManagement from './InvoiceManagement'; // NEW IMPORT

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await orderService.getOrderDetails(orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusUpdate = async (formData: OrderStatusUpdateData) => {
    if (!orderId) return;
    
    try {
      await orderService.updateOrderStatus(orderId, formData);
      await fetchOrderDetails(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleShippingUpdate = async (formData: ShippingUpdateData) => {
    if (!orderId) return;
    
    try {
      // For shipping updates, we'll use the status update endpoint with shipped status
      await orderService.updateOrderStatus(orderId, {
        status: 'shipped',
        ...formData
      });
      await fetchOrderDetails(); // Refresh data
    } catch (error) {
      console.error('Error updating shipping info:', error);
    }
  };

  const handleAddNote = async (formData: AdminNoteFormData) => {
    if (!orderId) return;
    
    try {
      await orderService.addAdminNote(orderId, formData);
      await fetchOrderDetails(); // Refresh data
    } catch (error) {
      console.error('Error adding admin note:', error);
    }
  };

  // NEW: Handle invoice updates
  const handleInvoiceUpdate = async () => {
    await fetchOrderDetails(); // Refresh order data when invoices change
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-red-600">Order not found</p>
      </div>
    );
  }

  // UPDATED: Added invoices tab
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'timeline', name: 'Timeline' },
    { id: 'invoices', name: 'Invoices' }, // NEW TAB
    { id: 'notes', name: 'Admin Notes' },
    { id: 'shipping', name: 'Shipping' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-blue-600 hover:text-blue-900 mb-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <StatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment.status} />
            <ShippingStatusBadge status={order.status} deliveredAt={order.deliveredAt} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
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
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <OrderItems items={order.items} pricing={order.pricing} />
              <OrderSummary order={order} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <OrderTimeline timeline={order.orderTimeline} />
          )}

          {/* NEW: Invoices Tab */}
          {activeTab === 'invoices' && (
            <InvoiceManagement
              orderId={orderId!}
              orderNumber={order.orderNumber}
              onInvoiceUpdate={handleInvoiceUpdate}
            />
          )}

          {activeTab === 'notes' && (
            <AdminNotes
              notes={order.adminNotes}
              onAddNote={handleAddNote}
            />
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <ShippingUpdateForm
                order={order}
                onShippingUpdate={handleShippingUpdate}
              />
              <OrderSummary order={order} />
            </div>
          )}
        </div>

        {/* Sidebar - Your existing sidebar remains the same */}
        <div className="space-y-6">
          <StatusUpdateForm
            order={order}
            onStatusUpdate={handleStatusUpdate}
          />
          
          {/* Customer Information */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Customer Information
            </h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {order.user.firstName} {order.user.lastName}
              </p>
              <p>
                <strong>Email:</strong> {order.user.email}
              </p>
              {order.user.phone && (
                <p>
                  <strong>Phone:</strong> {order.user.phone}
                </p>
              )}
              {order.gstInfo?.isBusiness && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-800">Business Customer</p>
                  {order.gstInfo.gstNumber && (
                    <p className="text-sm text-blue-600">GST: {order.gstInfo.gstNumber}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Shipping Address
            </h3>
            <address className="not-italic text-sm">
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

          {/* Payment Information */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>Method:</strong> {order.payment.method}</p>
              <p><strong>Status:</strong> <PaymentStatusBadge status={order.payment.status} /></p>
              <p><strong>Attempts:</strong> {order.payment.totalAttempts}</p>
              {order.payment.attempts.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Last Attempt:</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.payment.attempts[0].createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;