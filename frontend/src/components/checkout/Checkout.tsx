import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { checkoutActions } from '../../redux/actions/checkoutActions';
import { 
  selectCheckoutData,
  selectCheckoutLoading,
  selectCheckoutError,
  selectCouponApplied,
  selectCurrentShippingAddress,
  selectCurrentBillingAddress,
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

export type CheckoutStep = 'address' | 'payment' ;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const checkoutData = useAppSelector(selectCheckoutData);
  const loading = useAppSelector(selectCheckoutLoading);
  const error = useAppSelector(selectCheckoutError);
  const couponApplied = useAppSelector(selectCouponApplied);
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
  const [createdOrderId, setCreatedOrderId] = useState<string>(''); // ✅ Store created order ID

  // Fetch checkout data on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/checkout');
      return;
    }
    dispatch(checkoutActions.fetchCheckoutData());
  }, [dispatch, isAuthenticated, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (checkoutData && checkoutData.cartItems.length === 0) {
      navigate('/cart');
    }
  }, [checkoutData, navigate]);

  // Handle coupon application
  const handleApplyCoupon = async (couponCode: string) => {
    try {
      await dispatch(checkoutActions.calculateCheckout({ 
        couponCode, 
        shippingAddressId: shippingAddress?._id 
      })).unwrap();
    } catch (error) {
      console.error('Failed to apply coupon:', error);
    }
  };

  // Handle address save
  const handleSaveAddress = async (addressData: any, setAsDefault = false) => {
    try {
      await dispatch(checkoutActions.saveAddress({ address: addressData, setAsDefault })).unwrap();
      setShowAddressForm(false);
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isCheckoutValid || !paymentMethod) return;

    setProcessingOrder(true);
    try {
      const result = await dispatch(checkoutActions.createOrder(orderData)).unwrap();
      const newOrderId = result.orderId || result.order?._id || result.orderNumber;
      
      if (newOrderId) {
        setCreatedOrderId(newOrderId);
        console.log('✅ Order created successfully:', newOrderId);
        // Stay on payment step - PaymentMethod will auto-open Razorpay
      } else {
        throw new Error('Failed to create order - no order ID returned');
      }
    } catch (error: any) {
      console.error('Failed to create order:', error);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Remove handleNextStep and handlePrevStep for review step
  const handleNextStep = () => {
    if (currentStep === 'address') {
      setCurrentStep('payment');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
    }
  };

  if (loading && !checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!checkoutData || checkoutData.cartItems.length === 0) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
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
                          : step === 'review' && currentStep === 'review'
                          ? 'bg-green-600 text-white'
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
                      {step === 'review' && 'Review'}
                    </span>
                    {index < 2 && (
                      <div
                        className={`mx-4 w-12 h-0.5 ${
                          currentStep === step || (index === 0 && currentStep === 'payment') || currentStep === 'review'
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* ✅ FIXED: Address Step */}
              {currentStep === 'address' && (
                <CheckoutStep
                  title="Shipping Address"
                  description="Where should we deliver your order?"
                >
                  <div className="space-y-6">
                    {/* Address Selection */}
                    {addresses.length > 0 && (
                      <AddressSelection
                        addresses={addresses}
                        selectedAddress={shippingAddress?._id || shippingAddress?.id}
                        onSelectAddress={(addressId) => {
                          console.log('Selecting address:', addressId);
                          dispatch(setShippingAddress(addressId));
                        }}
                        onAddNewAddress={() => setShowAddressForm(true)}
                      />
                    )}

                    {/* Address Form */}
                    {showAddressForm && (
                      <AddressForm
                        onSave={handleSaveAddress}
                        onCancel={() => setShowAddressForm(false)}
                      />
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
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                </CheckoutStep>
              )}

{currentStep === 'payment' && (
  <CheckoutStep
    title="Payment Method"
    description={createdOrderId ? "Complete your payment" : "How would you like to pay?"}
  >
    <div className="space-y-6">
      {/* Show loading if order is being created */}
      {processingOrder && !createdOrderId && (
        <div className="text-center py-4">
          <LoadingSpinner size="medium" />
          <p className="text-gray-600 mt-2">Creating your order...</p>
        </div>
      )}

      {/* Show payment method */}
      <PaymentMethod
        selectedMethod={paymentMethod}
        onSelectMethod={(method) => dispatch(setPaymentMethod(method))}
        orderId={createdOrderId}
        amount={total}
        currency="INR"
        onPaymentSuccess={(paymentData) => {
          console.log('Payment successful:', paymentData);
          navigate(`/order-confirmation/${paymentData.orderNumber}`);
        }}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
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
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
          >
            Back to Address
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={!paymentMethod}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Order & Pay
          </button>
        </div>
      )}

      {/* Show only back button if order is created */}
      {createdOrderId && (
        <div className="flex justify-between pt-6">
          <button
            onClick={() => {
              setCreatedOrderId('');
              setCurrentStep('address');
            }}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
          >
            Back to Address
          </button>
          <button
            onClick={() => {
              // Manual retry button
              dispatch(setPaymentMethod('razorpay'));
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Retry Payment
          </button>
        </div>
      )}
    </div>
  </CheckoutStep>
)}

              {/* ✅ FIXED: Review Step */}
              {currentStep === 'review' && (
                <CheckoutStep
                  title="Review Order"
                  description="Please review your order before placing"
                >
                  <div className="space-y-6">
                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.cartItemId} className="flex items-center space-x-4 border-b pb-4">
                            <img
                              src={item.image || '/placeholder-image.jpg'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × ₹{item.price}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-gray-500">
                                  Variant: {item.variant.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{item.total}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Shipping Address</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium">
                          {shippingAddress?.firstName} {shippingAddress?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shippingAddress?.addressLine1}
                          {shippingAddress?.addressLine2 && `, ${shippingAddress.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}
                        </p>
                        <p className="text-sm text-gray-600">
                          {shippingAddress?.phone} • {shippingAddress?.email}
                        </p>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Payment Method</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium capitalize">{paymentMethod || 'Not selected'}</p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                      <button
                        onClick={handlePrevStep}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
                      >
                        Back to Payment
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!isCheckoutValid || processingOrder}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {processingOrder && <LoadingSpinner size="small" />}
                        <span>
                          {processingOrder ? 'Creating Order...' : `Proceed to Payment - ₹${total}`}
                        </span>
                      </button>
                    </div>
                  </div>
                </CheckoutStep>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;