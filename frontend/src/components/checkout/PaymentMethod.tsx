import React, { useState, useEffect } from 'react';
import { loadRazorpay, RazorpayResponse, RazorpayError } from '../utils/razorpay';
import api from '../config/axiosConfig'; // Import your axios config

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

  // ✅ AUTO-OPEN RAZORPAY WHEN ORDER ID IS AVAILABLE
  useEffect(() => {
    if (orderId && selectedMethod === 'razorpay' && !processing && !autoOpened) {
      console.log('🔄 Auto-opening Razorpay for order:', orderId);
      setAutoOpened(true);
      initializeRazorpayPayment();
    }
  }, [orderId, selectedMethod, processing, autoOpened]);

  // Reset auto-opened state when orderId changes
  useEffect(() => {
    setAutoOpened(false);
  }, [orderId]);

  const paymentMethods: PaymentMethodType[] = [
    {
      id: 'razorpay',
      name: 'Secure Payment',
      description: 'Pay via Credit/Debit Card, UPI, Net Banking, Wallet',
      icon: '💳',
      supportedMethods: ['Cards', 'UPI', 'Net Banking', 'Wallets', 'Pay Later']
    }
  ];

  const initializeRazorpayPayment = async (): Promise<void> => {
    console.log('🟡 Initializing Razorpay payment:', { orderId, amount });
    
    if (!orderId || amount <= 0) {
      console.error('❌ Invalid order details:', { orderId, amount });
      onPaymentError('Invalid order details. Please try again.');
      return;
    }

    try {
      setProcessing(true);
      
      console.log('🟡 Creating Razorpay order for:', orderId);
      
      // ✅ FIXED: Use axios instead of fetch (handles auth automatically)
      const response = await api.post('/payment/razorpay/create-order', { orderId });
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
        amount: result.data.amount,
        currency: result.data.currency,
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
            setProcessing(false);
            setAutoOpened(false);
            onSelectMethod(null);
          },
          escape: false,
          backdropclose: false
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response: RazorpayError) {
        console.error('❌ Payment failed:', response);
        setProcessing(false);
        setAutoOpened(false);
        onPaymentError(response.error.description || 'Payment failed. Please try again.');
      });

      razorpayInstance.open();
      console.log('✅ Razorpay checkout opened');

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      onPaymentError(error.message || 'Failed to initialize payment');
      setProcessing(false);
      setAutoOpened(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse): Promise<void> => {
    try {
      setProcessing(true);

      // ✅ FIXED: Use axios for verification too
      const verifyResponse = await api.post('/payment/razorpay/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId,
        attemptId: currentAttemptId
      });

      const result = verifyResponse.data;

      if (result.success) {
        console.log('✅ Payment verification successful:', result.data);
        onPaymentSuccess(result.data);
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }

    } catch (error: any) {
      console.error('Payment verification error:', error);
      onPaymentError(error.message || 'Payment verification failed. Please contact support.');
    } finally {
      setProcessing(false);
      setCurrentAttemptId(null);
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

  const handleMethodSelect = (method: 'razorpay'): void => {
    if (processing) return;
    
    onSelectMethod(method);
    
    // Auto-initiate Razorpay payment when selected
    if (method === 'razorpay' && orderId && amount > 0) {
      initializeRazorpayPayment();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Select Payment Method</h3>
        <p className="text-sm text-gray-600 mt-1">Complete your purchase securely</p>
      </div>
      
      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            } ${processing ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => !processing && handleMethodSelect(method.id)}
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
                
                <p className="text-sm text-gray-600 mt-1">
                  {method.description}
                </p>
                
                {/* Supported payment methods */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {method.supportedMethods.map((supportedMethod, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {supportedMethod}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500'
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