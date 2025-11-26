import React, { useState, useEffect, useRef } from 'react';
import { loadRazorpay, RazorpayResponse, RazorpayError } from '../utils/razorpay';
import api from '../config/axiosConfig';

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  selectedMethod,
  onSelectMethod,
  orderId,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError,
  userData
}) => {
  const [processing, setProcessing] = useState<boolean>(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState<boolean>(false);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  
  // Use ref to track if payment is currently open
  const isPaymentOpenRef = useRef<boolean>(false);
  const paymentAttemptsRef = useRef<number>(0);
  const maxAttempts = 3;

  // ✅ FIXED: Auto-open only when all conditions are met including valid amount
  useEffect(() => {
    if (orderId && 
        selectedMethod === 'razorpay' && 
        !processing && 
        !autoOpened && 
        !hasFailed &&
        paymentAttemptsRef.current === 0 &&
        !isPaymentOpenRef.current &&
        amount > 0) { // ✅ ADDED: Check for valid amount
      
      console.log('🔄 Auto-opening Razorpay for order:', { orderId, amount });
      setAutoOpened(true);
      isPaymentOpenRef.current = true;
      initializeRazorpayPayment();
    }
  }, [orderId, selectedMethod, processing, autoOpened, hasFailed, amount]); // ✅ ADDED: amount to dependencies

  // Reset states when orderId changes
  useEffect(() => {
    setAutoOpened(false);
    setHasFailed(false);
    isPaymentOpenRef.current = false;
    paymentAttemptsRef.current = 0;
  }, [orderId]);

  const paymentMethods: PaymentMethodType[] = [
    {
      id: 'razorpay',
      name: hasFailed ? 'Retry Secure Payment' : 'Secure Payment',
      description: hasFailed ? 'Click to retry payment' : 'Pay via Credit/Debit Card, UPI, Net Banking, Wallet',
      icon: '💳',
      supportedMethods: ['Cards', 'UPI', 'Net Banking', 'Wallets', 'Pay Later']
    }
  ];

  const initializeRazorpayPayment = async (): Promise<void> => {
    console.log('🟡 Initializing Razorpay payment:', { orderId, amount });
    
    // ✅ IMPROVED VALIDATION: Better error messages
    if (!orderId) {
      console.error('❌ Invalid order details: Missing orderId');
      onPaymentError('Order not found. Please try creating the order again.');
      return;
    }

    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount for payment:', amount);
      onPaymentError('Order amount is not available. Please refresh the page or try again.');
      return;
    }

    // Check maximum attempts
    if (paymentAttemptsRef.current >= maxAttempts) {
      console.error('❌ Maximum payment attempts reached');
      onPaymentError('Maximum payment attempts reached. Please contact support.');
      return;
    }

    try {
      setProcessing(true);
      isPaymentOpenRef.current = true;
      paymentAttemptsRef.current += 1;
      
      console.log('🟡 Creating Razorpay order for:', { orderId, amount });
      
      // ✅ FIXED: Pass amount to backend to ensure consistency
      const response = await api.post('/payment/razorpay/create-order', { 
        orderId,
        amount: Math.round(amount * 100) // Convert to paise for Razorpay
      });
      const result = response.data;

      console.log('🟡 Razorpay order response:', result);

      if (!result.success) {
        if (result.data?.alreadyPaid) {
          console.log('✅ Order already paid');
          onPaymentSuccess(result.data);
          return;
        }
        throw new Error(result.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, attemptId } = result.data;
      setCurrentAttemptId(attemptId);

      console.log('🟡 Razorpay order created:', razorpayOrderId);

      // Load Razorpay SDK
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      console.log('🟡 Opening Razorpay checkout...');

      const options = {
        key: "rzp_test_Rhd3c2tvDK3obS",
        amount: result.data.amount || Math.round(amount * 100), // Fallback to frontend amount
        currency: result.data.currency || 'INR',
        name: 'iTech Store',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          console.log('✅ Payment successful:', response);
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: userData?.name || 'Customer',
          email: userData?.email || 'customer@example.com',
          contact: userData?.contact || '9999999999'
        },
        notes: {
          orderId: orderId,
          attemptId: attemptId
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Payment cancelled by user');
            handlePaymentClose();
          },
          escape: true, // Allow escape key
          backdropclose: true // Allow backdrop click
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response: RazorpayError) {
        console.error('❌ Payment failed:', response);
        handlePaymentFailure(response.error.description || 'Payment failed. Please try again.');
      });

      // Handle when modal is closed without payment
      razorpayInstance.on('modal.closed', function() {
        console.log('ℹ️ Payment modal closed');
        handlePaymentClose();
      });

      razorpayInstance.open();
      console.log('✅ Razorpay checkout opened');

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      handlePaymentFailure(error.message || 'Failed to initialize payment');
    }
  };

  const handlePaymentClose = (): void => {
    console.log('🔄 Resetting payment state after close');
    setProcessing(false);
    isPaymentOpenRef.current = false;
    // Don't set autoOpened to false - we want to prevent auto-reopening
  };

  const handlePaymentFailure = (errorMessage: string): void => {
    console.error('💥 Payment failed:', errorMessage);
    setProcessing(false);
    setHasFailed(true); // ✅ Mark as failed to prevent auto-reopening
    isPaymentOpenRef.current = false;
    onPaymentError(errorMessage);
  };

  const handlePaymentSuccess = async (response: RazorpayResponse): Promise<void> => {
    console.log('🎯 Payment successful, starting verification...', response);
    
    try {
      setProcessing(true);

      const verifyResponse = await api.post('/payment/razorpay/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId,
        attemptId: currentAttemptId
      });

      console.log('✅ Verification successful:', verifyResponse.data);
      
      // ✅ SUCCESS - Reset all states
      setProcessing(false);
      setHasFailed(false);
      isPaymentOpenRef.current = false;
      paymentAttemptsRef.current = 0;
      
      onPaymentSuccess(verifyResponse.data);

    } catch (error: any) {
      console.error('💥 Payment verification error:', error);
      handlePaymentFailure('Payment verification failed. Please try again.');
    }
  };

  const handleMethodSelect = (method: 'razorpay'): void => {
    if (processing) return;
    
    // ✅ ADDED: Check for valid amount before proceeding
    if (!amount || amount <= 0) {
      onPaymentError('Order amount is not available. Please wait or refresh the page.');
      return;
    }
    
    onSelectMethod(method);
    
    // Manual retry - reset failure state
    if (hasFailed) {
      setHasFailed(false);
      setAutoOpened(false);
      isPaymentOpenRef.current = false;
    }
    
    // Initiate payment when selected (manual retry)
    if (method === 'razorpay' && orderId && amount > 0) {
      initializeRazorpayPayment();
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
    const validCurrency = currencyCode && typeof currencyCode === 'string' && currencyCode.length === 3 
      ? currencyCode 
      : 'INR';
    
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: validCurrency,
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `₹${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">
          {hasFailed ? 'Payment Failed - Try Again' : 'Select Payment Method'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {hasFailed ? 'Your payment failed. Please try again.' : 'Complete your purchase securely'}
        </p>
      </div>
      
      {/* Error Message */}
      {hasFailed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-red-700 text-sm">
                Payment failed. Click the payment method below to try again.
                {paymentAttemptsRef.current >= maxAttempts && (
                  <span className="block mt-1 font-medium">
                    Maximum attempts reached. Please contact support.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : hasFailed 
                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            } ${processing ? 'opacity-60 cursor-not-allowed' : ''} ${
              paymentAttemptsRef.current >= maxAttempts ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => {
              if (!processing && paymentAttemptsRef.current < maxAttempts) {
                handleMethodSelect(method.id);
              }
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="text-2xl">{method.icon}</div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-base">
                    {method.name}
                  </h4>
                  {processing && selectedMethod === method.id && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-blue-600 font-medium">Processing...</span>
                    </div>
                  )}
                </div>
                
                <p className={`text-sm mt-1 ${
                  hasFailed ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {method.description}
                </p>
                
                {/* Attempt counter */}
                {paymentAttemptsRef.current > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      Attempt {paymentAttemptsRef.current} of {maxAttempts}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 ml-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedMethod === method.id
                      ? hasFailed ? 'border-red-500 bg-red-500' : 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {selectedMethod === method.id && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Payment Security & Information */}
      <div className="space-y-4">
        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-green-800 text-sm">Secure Payment</h4>
              <p className="text-green-700 text-sm mt-1">
                Your payment information is encrypted and secure. We do not store your card details.
                All transactions are processed through Razorpay's secure payment gateway.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Amount to Pay:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(amount || 0, currency || 'INR')}
            </span>
          </div>
          {orderId && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Order ID:</span>
              <span className="text-xs font-mono text-gray-600">{orderId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;