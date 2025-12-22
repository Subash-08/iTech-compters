import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, Printer, MapPin, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
// Import your axios instance
import api from '../config/axiosConfig';
// Import the image utility
import { getImageUrl } from '../utils/imageUtils'; 

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Retrieving your receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'We couldn\'t find the order details you requested.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200 font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        
        {/* Success Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-400 to-green-500 mb-6 shadow-xl shadow-emerald-200"
          >
            <CheckCircle2 className="h-12 w-12 text-white stroke-[3]" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Order Confirmed!</h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            Thank you for your purchase. We've received your order <span className="font-mono font-bold text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded border border-slate-200 text-base">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Order Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Card Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Order Summary
              </h2>
              <p className="text-xs text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-white px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Download Receipt
            </button>
          </div>

          <div className="p-8">
            {/* Items List */}
            <div className="space-y-6 mb-8">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start justify-between group">
                  <div className="flex gap-5">
                    <div className="h-20 w-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
                      {item.image ? (
                        <img 
                          src={getImageUrl(item.image)} 
                          alt={item.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-medium">No Image</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg mb-1">{item.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-lg">₹{item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-slate-100 w-full mb-8"></div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Shipping Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Shipping Address
                </h3>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <address className="not-italic text-slate-700 text-sm leading-relaxed">
                    <span className="block font-semibold text-slate-900 mb-1">Delivery Location</span>
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 mt-2 inline-block">
                      PIN: {order.shippingAddress.pincode}
                    </span>
                  </address>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Details
                </h3>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{order.pricing.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium">₹{order.pricing.tax.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total Paid</span>
                    <span className="text-xl font-bold text-indigo-600">₹{order.pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 px-8 py-3.5 border border-slate-200 shadow-sm text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
          <Link 
            to="/products" 
            className="flex items-center justify-center gap-2 px-8 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default OrderConfirmation;