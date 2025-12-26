import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { checkoutActions } from '../../redux/actions/checkoutActions';
import { clearCheckoutData } from '../../redux/slices/checkoutSlice';
import { 
  selectCheckoutData,
  selectCheckoutLoading,
  selectCheckoutError,
  selectCouponApplied,
  selectCurrentShippingAddress,
  selectCurrentBillingAddress,
  selectSelectedShippingAddress,
  selectSelectedBillingAddress,
  selectGSTInfo,
  selectPaymentMethod,
  selectSubtotal,
  selectShippingCost,
  selectTaxAmount,
  selectDiscountAmount,
  selectGrandTotal,
  selectCheckoutCartItems,
  selectCheckoutAddresses,
  selectIsCheckoutValid,
  selectOrderCreationData
} from '../../redux/selectors/checkoutSelectors';
import { selectIsAuthenticated } from '../../redux/selectors';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import CheckoutStep from './CheckoutStep';
import AddressForm from './AddressForm';
import AddressSelection from './AddressSelection';
import OrderSummary from './OrderSummary';
import PaymentMethod from './PaymentMethod';
import GSTInfoForm from './GSTInfoForm';
import CouponForm from './CouponForm';
import { 
  setShippingAddress,
  setBillingAddress,
  setGSTInfo,
  setPaymentMethod,
  clearCoupon 
} from '../../redux/slices/checkoutSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  MapPin,
  CreditCard,
  Shield,
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Plus,
  Check
} from 'lucide-react';

export type CheckoutStep = 'address' | 'payment';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const checkoutData = useAppSelector(selectCheckoutData);
  const loading = useAppSelector(selectCheckoutLoading);
  const error = useAppSelector(selectCheckoutError);
  const couponApplied = useAppSelector(selectCouponApplied);
  const shippingAddressId = useAppSelector(selectSelectedShippingAddress);
  const billingAddressId = useAppSelector(selectSelectedBillingAddress);
  const shippingAddress = useAppSelector(selectCurrentShippingAddress);
  const billingAddress = useAppSelector(selectCurrentBillingAddress);
  const gstInfo = useAppSelector(selectGSTInfo);
  const paymentMethod = useAppSelector(selectPaymentMethod);
  const subtotal = useAppSelector(selectSubtotal);
  const shipping = useAppSelector(selectShippingCost);
  const tax = useAppSelector(selectTaxAmount);
  const discount = useAppSelector(selectDiscountAmount);
  const total = useAppSelector(selectGrandTotal);
  const cartItems = useAppSelector(selectCheckoutCartItems);
  const addresses = useAppSelector(selectCheckoutAddresses);
  const isCheckoutValid = useAppSelector(selectIsCheckoutValid);
  const orderData = useAppSelector(selectOrderCreationData);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Local state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showGSTForm, setShowGSTForm] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [addressRefreshing, setAddressRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false); // ADD THIS LINE

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  useEffect(() => {
    if (document.getElementById("razorpay-sdk")) return;

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    document.body.appendChild(script);
  }, []);
  const handleUpdateAddress = async (addressId: string, addressData: any, setAsDefault = false) => {
    try {
      setPaymentError('');
      await dispatch(checkoutActions.updateAddress({ 
        addressId, 
        address: addressData, 
        setAsDefault 
      })).unwrap();
      
      await dispatch(checkoutActions.fetchCheckoutData()).unwrap();
    } catch (error: any) {
      console.error('Failed to update address:', error);
      setPaymentError(error.message || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setPaymentError('');
      await dispatch(checkoutActions.deleteAddress(addressId)).unwrap();
      
      await dispatch(checkoutActions.fetchCheckoutData()).unwrap();
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      setPaymentError(error.message || 'Failed to delete address');
    }
  };

  // Fetch checkout data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/checkout');
      return;
    }
    
    if (!createdOrderId) {
      dispatch(checkoutActions.fetchCheckoutData());
    }
  }, [dispatch, isAuthenticated, navigate, createdOrderId]);

  // Handle coupon application
  const handleApplyCoupon = async (couponCode: string) => {
    try {
      setPaymentError('');
      await dispatch(checkoutActions.calculateCheckout({ 
        couponCode, 
        shippingAddressId: shippingAddress?._id 
      })).unwrap();
    } catch (error: any) {
      console.error('Failed to apply coupon:', error);
      setPaymentError(error.message || 'Failed to apply coupon');
    }
  };

  const handleSaveAddress = async (addressData: any, setAsDefault = false) => {
    try {
      setPaymentError('');
      setAddressRefreshing(true);
      await dispatch(checkoutActions.saveAddress({ address: addressData, setAsDefault })).unwrap();
      
      await dispatch(checkoutActions.fetchCheckoutData()).unwrap();
      
      setShowAddressForm(false);
    } catch (error: any) {
      console.error('Failed to save address:', error);
      setPaymentError(error.message || 'Failed to save address');
    } finally {
      setAddressRefreshing(false);
    }
  };

  // Enhanced order creation
  const handlePlaceOrder = async () => {
    if (!isCheckoutValid || !paymentMethod || !shippingAddress) return;

    setPaymentError('');
    setProcessingOrder(true);
    try {
      const orderPayload = {
        ...orderData,
        shippingAddressId: shippingAddress._id || shippingAddress.id,
        billingAddressId: billingAddress?._id || billingAddress?.id,
        paymentMethod: paymentMethod
      };
      const result = await dispatch(checkoutActions.createOrder(orderPayload)).unwrap();
      const newOrderId = result.orderId || result.order?._id || result.orderNumber;
      
      if (newOrderId) {
        setCreatedOrderId(newOrderId);
      } else {
        throw new Error('Failed to create order - no order ID returned');
      }
    } catch (error: any) {
      console.error('Failed to create order:', error);
      setPaymentError(error.message || 'Failed to create order');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Enhanced payment success handler
  const handlePaymentSuccess = async (paymentData: any) => {
    setPaymentError('');
    setPaymentCompleted(true); // ADD THIS LINE - Set payment completed to true
    
    try {
      const orderNumber = paymentData.data?.orderNumber || createdOrderId;
      
      // Clear checkout data after a short delay (optional)
      setTimeout(() => {
        dispatch(clearCheckoutData());
      }, 1000);
      
      // Navigate immediately to order confirmation
      setTimeout(() => {
        if (orderNumber) {
          navigate(`/order-confirmation/${orderNumber}`);
        } else {
          navigate('/order-confirmation/success');
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('💥 Payment processing failed:', error);
      setPaymentError(error.message || 'Payment processing failed. Please try again.');
      setPaymentCompleted(false); // Reset if error occurs
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'address') {
      setCurrentStep('payment');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
      setCreatedOrderId('');
      setPaymentError('');
    }
  };

  // Premium Payment Loader
  const PaymentLoader = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          
          <motion.h3 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-slate-900 mt-6 mb-2"
          >
            {processingOrder ? 'Securing Your Order' : 'Processing Payment'}
          </motion.h3>
          
          <p className="text-slate-600 text-center mb-6">
            {processingOrder 
              ? 'Please wait while we prepare your order...' 
              : 'Please wait while we process your payment...'
            }
          </p>
          
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Amount:</span>
              <span className="text-lg font-semibold text-slate-900">₹{total.toLocaleString()}</span>
            </div>
            
            {createdOrderId && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center py-2"
              >
                <span className="text-slate-600">Order ID:</span>
                <span className="font-mono text-sm bg-slate-50 px-2 py-1 rounded text-slate-800">
                  {createdOrderId.slice(-8)}
                </span>
              </motion.div>
            )}
            
            <div className="pt-4">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Premium Success Animation
  const SuccessAnimation = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-10 max-w-md w-full mx-4 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <CheckCircle className="w-12 h-12 text-white" />
          <motion.div 
            className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500/30 to-green-400/30"
            initial={{ scale: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
        
        <motion.h3 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold text-slate-900 mb-3"
        >
          Payment Successful!
        </motion.h3>
        
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-600 mb-6"
        >
          Your order has been confirmed and is being processed.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-slate-500"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>Redirecting to order confirmation...</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // ADD THIS COMPONENT - Order Success View
  const OrderSuccessView = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center border border-slate-100">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.1 }}
          className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-green-200 shadow-xl"
        >
          <Check className="w-12 h-12 text-white stroke-[3]" />
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-slate-900 mb-2"
        >
          Order Confirmed!
        </motion.h2>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 text-lg mb-8"
        >
          Thank you for your purchase. We are redirecting you to your receipt.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
            <motion.div 
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
          <span className="text-sm font-medium text-emerald-600">Redirecting...</span>
        </motion.div>
      </div>
    </motion.div>
  );

  // MODIFIED THIS CONDITION - Check for paymentCompleted state
  if (paymentCompleted) {
    return <OrderSuccessView />;
  }

  if (loading && !checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex flex-col items-center justify-center">
        <LoadingSpinner 
          size="xl" 
          variant="gradient" 
          label="Loading checkout..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (!checkoutData || checkoutData.cartItems?.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center"
      >
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your cart is empty</h2>
          <p className="text-slate-600 mb-8">Add items to your cart to begin checkout</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/cart')}
            className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            Return to Cart
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {(processingOrder) && <PaymentLoader />}
        {showSuccessAnimation && <SuccessAnimation />}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-white to-slate-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Premium Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-2"
          >
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full opacity-10 blur-sm"></div>
                <div className="relative bg-gradient-to-br from-white to-slate-50 p-3 rounded-2xl border border-slate-200/50 shadow-sm">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Secure Checkout
              </h1>
            </div>
            <p className="text-slate-600 mx-auto">
              Complete your purchase with confidence
            </p>
          </motion.div>

          {/* Error Display */}
          {/* <AnimatePresence>
            {(error || paymentError) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-4 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl border border-rose-200/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <p className="text-sm text-rose-800">{error || paymentError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Progress Steps - Premium Design */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200/50 shadow-sm p-4 mb-4"
              >
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {['address', 'payment'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                          currentStep === step
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg'
                            : currentStep === 'payment' && step === 'address'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white'
                            : 'bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500'
                        }`}
                      >
                        {index + 1}
                        {step === 'address' && currentStep === 'address' && (
                          <motion.div 
                            className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-blue-500/20"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      
                      <div className="ml-2">
                        <p className={`text-sm font-medium ${
                          currentStep === step
                            ? 'text-slate-900'
                            : 'text-slate-500'
                        }`}>
                          {step === 'address' ? 'Shipping Address' : 'Payment'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {step === 'address' ? 'Step 1 of 2' : 'Step 2 of 2'}
                        </p>
                      </div>
                      
                      {index < 1 && (
                        <motion.div 
                          className={`w-12 h-0.5 ${
                            currentStep === 'payment' 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-slate-200 to-slate-300'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Step Content */}
              <motion.div 
                key={currentStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden"
              >
                {/* Address Step */}
                {currentStep === 'address' && (
                  <div className="p-2">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Delivery Address</h2>
                        <p className="text-slate-600 text-sm">Where should we deliver your order?</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Address Selection */}
                      {(addresses.length > 0 || showAddressForm) && (
                        <AddressSelection
                          addresses={addresses}
                          selectedAddress={shippingAddressId}
                          onSelectAddress={(addressId) => {
                            dispatch(setShippingAddress(addressId));
                          }}
                          onAddNewAddress={() => setShowAddressForm(true)}
                          onUpdateAddress={handleUpdateAddress}
                          onDeleteAddress={handleDeleteAddress}
                          refreshing={addressRefreshing}
                        />
                      )}

                      {/* Address Form */}
                      <AnimatePresence>
                        {(showAddressForm || addresses.length === 0) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <AddressForm
                              onSave={handleSaveAddress}
                              onCancel={() => {
                                setShowAddressForm(false);
                                if (addresses.length === 0) {
                                  setShowAddressForm(true);
                                }
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* GST Information */}
                      <div className="border-t border-slate-100 pt-8">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                              <span className="text-xs font-bold text-emerald-700">GST</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-900">GST Information</h3>
                              <p className="text-slate-600 text-sm">Optional for business purchases</p>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowGSTForm(!showGSTForm)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                              showGSTForm
                                ? 'border-rose-200 text-rose-600 bg-rose-50'
                                : 'border-slate-300 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50'
                            }`}
                          >
                            {showGSTForm ? 'Cancel' : gstInfo ? 'Edit' : 'Add GST'}
                          </motion.button>
                        </div>
                        
                        {gstInfo && !showGSTForm && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200/50 p-5"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-500">GST Number</p>
                                <p className="font-medium text-slate-900">{gstInfo.gstNumber}</p>
                              </div>
                              {gstInfo.businessName && (
                                <div>
                                  <p className="text-xs text-slate-500">Business Name</p>
                                  <p className="font-medium text-slate-900">{gstInfo.businessName}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        <AnimatePresence>
                          {showGSTForm && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4"
                            >
                              <GSTInfoForm
                                gstInfo={gstInfo}
                                onSave={(gstData) => {
                                  dispatch(setGSTInfo(gstData));
                                  setShowGSTForm(false);
                                }}
                                onCancel={() => setShowGSTForm(false)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Continue Button */}
                      <div className="flex justify-end pt-6">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleNextStep}
                          disabled={!shippingAddress}
                          className={`px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                            shippingAddress
                              ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:shadow-lg hover:from-indigo-700 hover:to-blue-600'
                              : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Continue to Payment
                          <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Step */}
{currentStep === 'payment' && (
  // 1. Changed p-8 to p-4 md:p-8 for better mobile spacing
  <div className="p-4 md:p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
        <CreditCard className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Payment Method</h2>
      </div>
    </div>

    <div className="space-y-8">
      {/* Payment Method Component */}
      <PaymentMethod
        selectedMethod={paymentMethod}
        onSelectMethod={(method) => dispatch(setPaymentMethod(method))}
        orderId={createdOrderId}
        amount={total}
        currency="INR"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
          setPaymentError(error);
        }}
        userData={{
          name: `${shippingAddress?.firstName} ${shippingAddress?.lastName}`,
          email: shippingAddress?.email || '',
          contact: shippingAddress?.phone || ''
        }}
      />

      {/* Navigation Buttons */}
      {!createdOrderId && !processingOrder && (
        // 2. Changed layout to column-reverse on mobile, row on desktop
        <div className="flex flex-col-reverse gap-4 pt-6 border-t border-slate-100 md:flex-row md:justify-between md:items-center md:pt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevStep}
            // 3. Added w-full md:w-auto and justify-center
            className="flex w-full items-center justify-center gap-2 px-5 py-3 bg-gradient-to-b from-white to-slate-50 text-slate-700 font-medium rounded-xl border border-slate-300 hover:border-slate-400 hover:shadow-sm transition-all duration-300 md:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Address
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceOrder}
            disabled={!paymentMethod || !isCheckoutValid || total <= 0}
            // 3. Added w-full md:w-auto and justify-center
            className={`flex w-full items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 md:w-auto ${
              paymentMethod && isCheckoutValid && total > 0
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:shadow-lg hover:from-emerald-600 hover:to-teal-500'
                : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {processingOrder ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Order...
              </>
            ) : (
              <>
                <span>Pay ₹{total.toLocaleString()}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Back button if order is created */}
      {createdOrderId && (
        // 2. Applied same responsive layout fix here
        <div className="flex flex-col-reverse gap-4 pt-6 border-t border-slate-100 md:flex-row md:justify-between md:items-center md:pt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevStep}
            // 3. Added w-full md:w-auto and justify-center
            className="flex w-full items-center justify-center gap-2 px-5 py-3 bg-gradient-to-b from-white to-slate-50 text-slate-700 font-medium rounded-xl border border-slate-300 hover:border-slate-400 hover:shadow-sm transition-all duration-300 md:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Address
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => dispatch(setPaymentMethod('razorpay'))}
            // 3. Added w-full md:w-auto and justify-center
            className="flex w-full items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-semibold hover:shadow-lg hover:from-amber-600 hover:to-orange-500 transition-all duration-300 md:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Payment
          </motion.button>
        </div>
      )}
    </div>
  </div>
)}
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24"
              >
                {/* Coupon Form */}
                <CouponForm
                  couponApplied={couponApplied}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={() => dispatch(clearCoupon())}
                />
                
                {/* Order Summary */}
                <OrderSummary
                  subtotal={subtotal}
                  shipping={shipping}
                  tax={tax}
                  discount={discount}
                  total={total}
                  coupon={couponApplied}
                  itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  currency="INR"
                />

              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Checkout;