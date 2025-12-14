import React, { useState, useEffect, useRef } from 'react';
import { loadRazorpay, RazorpayResponse, RazorpayError } from '../utils/razorpay';
import api from '../config/axiosConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  RefreshCw, 
  IndianRupee, 
  Loader2, 
  CheckCircle2, 
  Smartphone, 
  Globe 
} from 'lucide-react';

// Re-defining interface to ensure self-containment if types aren't exported globally
interface PaymentMethodProps {
  selectedMethod: string;
  onSelectMethod: (method: any) => void;
  orderId: string;
  amount: number;
  currency: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: string) => void;
  userData: {
    name: string;
    email: string;
    contact: string;
  };
}

interface PaymentMethodType {
  id: 'razorpay';
  name: string;
  description: string;
  icon: React.ReactNode;
  supportedMethods: string[];
}

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
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing...');
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState<boolean>(false);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [paymentAttempts, setPaymentAttempts] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false); // For success animation
  
  const isPaymentOpenRef = useRef<boolean>(false);
  const maxAttempts = 3;

  // Auto-open logic
  useEffect(() => {
    if (orderId && 
        selectedMethod === 'razorpay' && 
        !processing && 
        !autoOpened && 
        !hasFailed &&
        paymentAttempts === 0 &&
        !isPaymentOpenRef.current &&
        amount > 0) {
      
      console.log('🔄 Auto-opening Razorpay for order:', { orderId, amount });
      setAutoOpened(true);
      isPaymentOpenRef.current = true;
      initializeRazorpayPayment();
    }
  }, [orderId, selectedMethod, processing, autoOpened, hasFailed, amount, paymentAttempts]);

  useEffect(() => {
    setAutoOpened(false);
    setHasFailed(false);
    setPaymentAttempts(0);
    setIsVerified(false);
    isPaymentOpenRef.current = false;
  }, [orderId]);

  const paymentMethods: PaymentMethodType[] = [
    {
      id: 'razorpay',
      name: hasFailed ? 'Retry Payment' : 'Pay Online',
      description: hasFailed ? 'Previous attempt failed. Click to try again.' : 'Cards, UPI, NetBanking, Wallets',
      icon: <CreditCard className="w-6 h-6" />,
      supportedMethods: ['Cards', 'UPI', 'NetBanking', 'Wallet']
    }
  ];

  const initializeRazorpayPayment = async (): Promise<void> => {
    console.log('🟡 Initializing Razorpay payment:', { orderId, amount });
    
    if (!orderId) {
      onPaymentError('Order not found. Please try creating the order again.');
      return;
    }

    if (!amount || amount <= 0) {
      onPaymentError('Order amount is not available. Please refresh the page.');
      return;
    }

    if (paymentAttempts >= maxAttempts) {
      onPaymentError('Maximum payment attempts reached. Please contact support.');
      return;
    }

    try {
      setProcessing(true);
      setLoadingMessage('Initializing Secure Gateway...');
      isPaymentOpenRef.current = true;
      setPaymentAttempts(prev => prev + 1);
      
      // Create Order
      const response = await api.post('/payment/razorpay/create-order', { 
        orderId,
        amount: Math.round(amount * 100)
      });
      const result = response.data;

      if (!result.success) {
        if (result.data?.alreadyPaid) {
          setIsVerified(true);
          setTimeout(() => onPaymentSuccess(result.data), 1500);
          return;
        }
        throw new Error(result.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, attemptId } = result.data;
      setCurrentAttemptId(attemptId);

      // Load SDK
      setLoadingMessage('Loading Payment Interface...');
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      const options = {
        key: "rzp_test_Rhd3c2tvDK3obS",
        amount: result.data.amount || Math.round(amount * 100),
        currency: result.data.currency || 'INR',
        name: 'iTech Store',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: userData?.name || 'Customer',
          email: userData?.email || 'customer@example.com',
          contact: userData?.contact || '9999999999'
        },
        notes: { orderId, attemptId },
        theme: { color: '#0f172a' },
        modal: {
          ondismiss: function() {
            handlePaymentClose();
          },
          escape: true,
          backdropclose: false
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response: RazorpayError) {
        handlePaymentFailure(response.error.description || 'Payment failed.');
      });

      // Update message while user is interacting with popup
      setLoadingMessage('Complete payment in popup...');
      razorpayInstance.open();

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      handlePaymentFailure(error.message || 'Failed to initialize payment');
    }
  };

  const handlePaymentClose = (): void => {
    setProcessing(false);
    isPaymentOpenRef.current = false;
  };

  const handlePaymentFailure = (errorMessage: string): void => {
    setProcessing(false);
    setHasFailed(true);
    isPaymentOpenRef.current = false;
    onPaymentError(errorMessage);
  };

  const handlePaymentSuccess = async (response: RazorpayResponse): Promise<void> => {
    try {
      setProcessing(true);
      setLoadingMessage('Verifying Payment...'); // Update status text

      const verifyResponse = await api.post('/payment/razorpay/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId,
        attemptId: currentAttemptId
      });

      // Success Animation State
      setIsVerified(true);
      setProcessing(false);
      setHasFailed(false);
      isPaymentOpenRef.current = false;
      setPaymentAttempts(0);
      
      // Delay callback slightly to let user see success animation
      setTimeout(() => {
        onPaymentSuccess(verifyResponse.data);
      }, 1500);

    } catch (error: any) {
      console.error('💥 Payment verification error:', error);
      handlePaymentFailure('Payment verification failed. Please check your bank statement.');
    }
  };

  const handleMethodSelect = (method: 'razorpay'): void => {
    if (processing) return;
    
    if (!amount || amount <= 0) {
      onPaymentError('Order amount is not available.');
      return;
    }
    
    onSelectMethod(method);
    
    if (hasFailed) {
      setHasFailed(false);
      setAutoOpened(false);
      isPaymentOpenRef.current = false;
    }
    
    if (method === 'razorpay' && orderId && amount > 0) {
      initializeRazorpayPayment();
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'INR'): string => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      return `₹${amount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* --- Full Overlay Loading/Success State --- */}
      <AnimatePresence>
        {(processing || isVerified) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-slate-100 shadow-xl"
          >
            {isVerified ? (
              // Success View
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Payment Successful!</h3>
                <p className="text-slate-500 text-sm">Redirecting to order confirmation...</p>
              </motion.div>
            ) : (
              // Loading View
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{loadingMessage}</h3>
                <p className="text-slate-500 text-xs max-w-[200px]">
                  Please do not close this window or press back.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Header --- */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {hasFailed ? (
            <>
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-600">Payment Failed</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5 text-slate-400" />
              Select Payment Method
            </>
          )}
        </h3>
        <p className="text-sm text-slate-500 mt-1 ml-7">
          {hasFailed 
            ? 'Don\'t worry, you haven\'t been charged. Please try again.' 
            : 'All transactions are secured with 256-bit SSL encryption.'
          }
        </p>
      </div>
      
      {/* --- Methods Grid --- */}
      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => {
              if (!processing && paymentAttempts < maxAttempts) {
                handleMethodSelect(method.id);
              }
            }}
            className={`group relative overflow-hidden border rounded-xl p-5 cursor-pointer transition-all duration-300 ${
              selectedMethod === method.id
                ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500 shadow-md'
                : hasFailed 
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50'
            } ${processing ? 'opacity-50 pointer-events-none' : ''} ${
              paymentAttempts >= maxAttempts ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start gap-4 relative z-10">
              {/* Custom Radio */}
              <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors duration-200 shrink-0 ${
                selectedMethod === method.id
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-slate-300 bg-white group-hover:border-slate-400'
              }`}>
                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold text-base ${selectedMethod === method.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {method.name}
                  </h4>
                  {/* Icons Strip */}
                  <div className="flex items-center gap-1.5 opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500">
                     <CreditCard className="w-4 h-4" />
                     <Smartphone className="w-4 h-4" />
                     <Globe className="w-4 h-4" />
                  </div>
                </div>
                
                <p className={`text-sm ${hasFailed ? 'text-rose-600' : 'text-slate-500'}`}>
                  {method.description}
                </p>
                
                {paymentAttempts > 0 && !processing && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">
                    <RefreshCw className="w-3 h-3" />
                    Retry Attempt {paymentAttempts}/{maxAttempts}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* --- Footer Info --- */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col gap-4">
        <div className="flex justify-between items-end pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Payable</p>
            <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
              <span className="text-lg text-slate-500 font-medium">₹</span>
              {amount.toLocaleString('en-IN')}
            </div>
          </div>
          {orderId && (
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 block">
                ID: {orderId.slice(-8).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Trusted Payment</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Processed via Razorpay's PCI-DSS certified gateway. We do not store card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;