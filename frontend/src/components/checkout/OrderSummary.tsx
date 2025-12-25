import React, { useEffect } from 'react';
import { CheckoutCoupon } from '../../redux/types/checkout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag,
  Truck,
  Receipt,
  Tag,
  ShieldCheck,
  Check,
  AlertCircle,
  IndianRupee,
  Sparkles,
  Info,
  CreditCard,
  X
} from 'lucide-react';

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon: CheckoutCoupon | null;
  itemCount: number;
  currency: string;
  onApplyCoupon?: (code: string) => void;
  onRemoveCoupon?: () => void;
  debugMode?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  shipping,
  tax,
  discount,
  total,
  coupon,
  itemCount,
  currency,
  onApplyCoupon,
  onRemoveCoupon,
  debugMode = false
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const freeShippingThreshold = 1000;
  const amountForFreeShipping = freeShippingThreshold - subtotal;
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30 backdrop-blur-sm">
        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-900">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Order Summary</h3>
          <p className="text-xs font-medium text-slate-500">{itemCount} items in cart</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Debug Panel */}
        <AnimatePresence>
          {debugMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 mb-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2 text-slate-100 font-bold border-b border-slate-700 pb-1">
                <Info className="w-3 h-3" /> DEBUG INFO
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span>Subtotal:</span> <span className="text-right">{subtotal}</span>
                <span>Tax:</span> <span className="text-right">{tax}</span>
                <span>Total:</span> <span className="text-right text-emerald-400">{total}</span>
                <span className="col-span-2 pt-1 mt-1 border-t border-slate-800 flex justify-between">
                    <span>Calc Check:</span>
                    <span className={Math.abs(total - (subtotal + shipping + tax - discount)) <= 1 ? "text-emerald-400" : "text-rose-400"}>
                        {Math.abs(total - (subtotal + shipping + tax - discount)) <= 1 ? 'PASS' : 'FAIL'}
                    </span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price Breakdown */}
        <div className="space-y-3.5">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              Subtotal
            </span>
            <span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
          </div>

          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              Shipping
            </span>
            <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
              {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
            </span>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              Tax (GST)
            </span>
            <span className="font-semibold text-slate-700">{formatCurrency(tax)}</span>
          </div>

          {/* Discount */}
          <AnimatePresence>
            {coupon && discount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-sm pt-1"
              >
                <span className="text-emerald-600 font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Discount <span className="text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">{coupon.code}</span>
                </span>
                <span className="font-bold text-emerald-600">-{formatCurrency(discount)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100"></div>

        {/* Total */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm font-medium text-slate-400">Total to Pay</span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Secure Payment
            </div>
          </div>
          <div className="text-right">
             <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(total)}</span>
             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-1">Inclusive of all taxes</p>
          </div>
        </div>

        {/* Free Shipping Progress */}
        {!qualifiesForFreeShipping && amountForFreeShipping > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 relative overflow-hidden"
          >
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-white rounded-full shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Unlock Free Shipping</span>
                </div>
                
                <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden mb-2">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                
                <p className="text-xs font-medium text-amber-700 flex justify-between">
                    <span>Add <span className="font-bold">{formatCurrency(amountForFreeShipping)}</span> more</span>
                    <span className="opacity-75">{Math.round((subtotal / freeShippingThreshold) * 100)}%</span>
                </p>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-200 to-transparent opacity-20 rounded-bl-full"></div>
          </motion.div>
        )}

        {/* Coupon Applied Section (Moved inside card for cohesion) */}
        <AnimatePresence>
            {coupon ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-emerald-600 border border-emerald-50">
                            <Check className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">{coupon.code}</p>
                            <p className="text-[10px] font-medium text-emerald-600">Coupon Applied</p>
                        </div>
                    </div>
                    {onRemoveCoupon && (
                        <button 
                            onClick={onRemoveCoupon}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </motion.div>
            ) : (
                onApplyCoupon && (
                    <button
                        onClick={() => onApplyCoupon('')}
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-sm hover:text-slate-900 transition-all duration-200 border-dashed"
                    >
                        <Tag className="w-4 h-4" />
                        Have a Promo Code?
                    </button>
                )
            )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default OrderSummary;