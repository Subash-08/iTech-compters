import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home, Printer } from 'lucide-react';
// Import your axios instance
import api from '../config/axiosConfig'; // Adjust path to your API utility

interface OrderDetails {
  _id: string;
  orderNumber: string;
  pricing: {
    total: number;
    subtotal: number;
    tax: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    image: string;
    total: number;
  }>;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
}

const OrderConfirmation: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Note: You need a backend endpoint that finds order by orderNumber
        // If you don't have one, you might need to change logic to use orderId
        const { data } = await api.get(`/order/number/${orderNumber}`);
        
        if (data.success) {
          setOrder(data.order);
        } else {
          setError('Failed to load order details');
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Order not found or error loading details.');
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber && orderNumber !== 'undefined') {
      fetchOrder();
    } else {
      setError('Invalid Order Number');
      setLoading(false);
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-red-500 text-xl mb-4">😕 {error || 'Order not found'}</div>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center border border-green-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. Your order <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span> has been received.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Order Summary
            </h2>
            <button 
              onClick={() => window.print()}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          <div className="p-6">
            {/* Items List */}
            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">₹{item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totals & Address Grid */}
            <div className="grid md:grid-cols-2 gap-8 pt-4">
              
              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping To</h3>
                <address className="not-italic text-gray-700 text-sm leading-relaxed">
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  PIN: {order.shippingAddress.pincode}
                </address>
              </div>

              {/* Financials */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{order.pricing.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>₹{order.pricing.tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total Paid</span>
                    <span>₹{order.pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <Link 
            to="/products" 
            className="flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;