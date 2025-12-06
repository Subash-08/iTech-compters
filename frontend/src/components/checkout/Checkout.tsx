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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);const [addressRefreshing, setAddressRefreshing] = useState(false);



  // ✅ ADDED: Debug effect to track amount changes
  useEffect(() => {
    console.log('💰 Checkout Amount Debug:', {
      total,
      subtotal,
      shipping,
      tax,
      discount,
      cartItems: cartItems?.length,
      createdOrderId,
      currentStep
    });
  }, [total, createdOrderId, currentStep]);

  const handleUpdateAddress = async (addressId: string, addressData: any, setAsDefault = false) => {
  try {
    setPaymentError('');
    await dispatch(checkoutActions.updateAddress({ 
      addressId, 
      address: addressData, 
      setAsDefault 
    })).unwrap();
    
    // Refresh checkout data to get updated addresses
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
    
    // Refresh checkout data to get updated addresses
    await dispatch(checkoutActions.fetchCheckoutData()).unwrap();
  } catch (error: any) {
    console.error('Failed to delete address:', error);
    setPaymentError(error.message || 'Failed to delete address');
  }
};

  // Fetch checkout data on component mount - only if no order created
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/checkout');
      return;
    }
    
    // Only fetch if no order has been created yet
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
    setAddressRefreshing(true); // Start refreshing
    await dispatch(checkoutActions.saveAddress({ address: addressData, setAsDefault })).unwrap();
    
    // Refresh checkout data to get updated addresses
    await dispatch(checkoutActions.fetchCheckoutData()).unwrap();
    
    setShowAddressForm(false);
  } catch (error: any) {
    console.error('Failed to save address:', error);
    setPaymentError(error.message || 'Failed to save address');
  } finally {
    setAddressRefreshing(false); // Stop refreshing
  }
};

  // Enhanced order creation
  const handlePlaceOrder = async () => {
    if (!isCheckoutValid || !paymentMethod || !shippingAddress) return;

    setPaymentError('');
    setProcessingOrder(true);
    try {
      // Ensure shipping address ID is included
      const orderPayload = {
        ...orderData,
        shippingAddressId: shippingAddress._id || shippingAddress.id,
        billingAddressId: billingAddress?._id || billingAddress?.id,
        paymentMethod: paymentMethod
      };

      console.log('🟡 Creating order with payload:', orderPayload);

      const result = await dispatch(checkoutActions.createOrder(orderPayload)).unwrap();
      const newOrderId = result.orderId || result.order?._id || result.orderNumber;
      
      if (newOrderId) {
        setCreatedOrderId(newOrderId);
        console.log('✅ Order created successfully:', newOrderId);
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

  // Enhanced payment success handler with cart clearing
  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('🎯 Payment successful, processing...', paymentData);
    setPaymentError('');
    
    try {
      // Clear checkout data (empty cart items)
      dispatch(clearCheckoutData());
      
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Get order number from payment data or created order
      const orderNumber = paymentData.data?.orderNumber || createdOrderId;
      
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

  // Enhanced loading components
  const PaymentLoader = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {processingOrder ? 'Creating Your Order...' : 'Processing Payment...'}
        </h3>
        <p className="text-gray-600">
          {processingOrder 
            ? 'Please wait while we prepare your order...' 
            : 'Please wait while we process your payment...'
          }
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">₹{total.toLocaleString()}</span>
          </div>
          {createdOrderId && (
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span className="font-mono text-xs">{createdOrderId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Success animation component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your order has been placed successfully.</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to order confirmation...</p>
      </div>
    </div>
  );

  // Don't redirect if cart is empty but we have a created order
  const shouldShowCheckout = checkoutData && 
    (checkoutData.cartItems?.length > 0 || createdOrderId);

  if (loading && !checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!shouldShowCheckout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/cart')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Show loading overlay during order creation or payment processing */}
      {(processingOrder) && <PaymentLoader />}
      
      {/* Show success animation before navigation */}
      {showSuccessAnimation && <SuccessAnimation />}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Complete your purchase</p>
          </div>

          {/* Error Display */}
          {(error || paymentError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error || paymentError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Steps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Steps */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  {['address', 'payment'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === step
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          currentStep === step ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step === 'address' && 'Address'}
                        {step === 'payment' && 'Payment'}
                      </span>
                      {index < 1 && (
                        <div
                          className={`mx-4 w-12 h-0.5 ${
                            currentStep === 'payment' ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Address Step */}
               {currentStep === 'address' && (
  <CheckoutStep
    title="Shipping Address"
    description="Where should we deliver your order?"
  >
    <div className="space-y-6">
      {/* Enhanced Address Selection with Edit/Delete */}
      {(addresses.length > 0 || showAddressForm) && (
<AddressSelection
  addresses={addresses}
  selectedAddress={shippingAddressId}
  onSelectAddress={(addressId) => {
    console.log('Selecting address:', addressId);
    dispatch(setShippingAddress(addressId));
  }}
  onAddNewAddress={() => setShowAddressForm(true)}
  onUpdateAddress={handleUpdateAddress}
  onDeleteAddress={handleDeleteAddress}
  refreshing={addressRefreshing} // Pass the refreshing state
/>
      )}

      {/* Address Form - Show when adding new address OR when no addresses exist */}
      {(showAddressForm || addresses.length === 0) && (
        <AddressForm
          onSave={handleSaveAddress}
          onCancel={() => {
            setShowAddressForm(false);
            // If no addresses exist, we can't cancel - user must add an address
            if (addresses.length === 0) {
              setShowAddressForm(true); // Keep form open if no addresses
            }
          }}
        />
      )}

      {/* Show standalone "Add New Address" button when we have addresses but form is not showing */}
      {addresses.length > 0 && !showAddressForm && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAddressForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add New Address
          </button>
        </div>
      )}

                      {/* GST Information */}
                      <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">GST Information (Optional)</h3>
                          <button
                            onClick={() => setShowGSTForm(!showGSTForm)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {showGSTForm ? 'Cancel' : gstInfo ? 'Edit' : 'Add GST'}
                          </button>
                        </div>
                        
                        {gstInfo && !showGSTForm && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm">
                              <strong>GST Number:</strong> {gstInfo.gstNumber}
                            </p>
                            {gstInfo.businessName && (
                              <p className="text-sm mt-1">
                                <strong>Business Name:</strong> {gstInfo.businessName}
                              </p>
                            )}
                          </div>
                        )}

                        {showGSTForm && (
                          <GSTInfoForm
                            gstInfo={gstInfo}
                            onSave={(gstData) => {
                              dispatch(setGSTInfo(gstData));
                              setShowGSTForm(false);
                            }}
                            onCancel={() => setShowGSTForm(false)}
                          />
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-end pt-6">
                        <button
                          onClick={handleNextStep}
                          disabled={!shippingAddress}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </div>
                  </CheckoutStep>
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && (
                  <CheckoutStep
                    title="Payment Method"
                    description={createdOrderId ? "Complete your payment" : "How would you like to pay?"}
                  >
                    <div className="space-y-6">
                      {/* Show payment method */}
                      <PaymentMethod
                        selectedMethod={paymentMethod}
                        onSelectMethod={(method) => dispatch(setPaymentMethod(method))}
                        orderId={createdOrderId}
                        amount={total} // ✅ FIXED: Pass the correct total amount
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

                      {/* Show "Create Order" button if no order ID yet */}
                      {!createdOrderId && !processingOrder && (
                        <div className="flex justify-between pt-6">
                          <button
                            onClick={handlePrevStep}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Back to Address
                          </button>
                          <button
                            onClick={handlePlaceOrder}
                            disabled={!paymentMethod || !isCheckoutValid || total <= 0} // ✅ ADDED: Check for valid total
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                          >
                            {processingOrder ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Order...</span>
                              </>
                            ) : (
                              `Pay - ₹${total.toLocaleString()}`
                            )}
                          </button>
                        </div>
                      )}

                      {/* Show only back button if order is created */}
                      {createdOrderId && (
                        <div className="flex justify-between pt-6">
                          <button
                            onClick={handlePrevStep}
                            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Back to Address
                          </button>
                          <button
                            onClick={() => {
                              // Manual retry button
                              dispatch(setPaymentMethod('razorpay'));
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Retry Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </CheckoutStep>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar with Coupon Form */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
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

                {/* Order Summary Details */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium mb-4">Order Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{cartItems.length} products</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                    </div>
                    {shippingAddress && (
                      <div className="pt-3 border-t">
                        <p className="font-medium text-gray-700">Shipping to:</p>
                        <p className="text-gray-600 text-xs mt-1">
                          {shippingAddress.city}, {shippingAddress.state}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;