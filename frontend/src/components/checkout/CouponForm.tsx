// Enhanced CouponForm component - Modern Redesign
import React, { useState } from 'react';
import { CheckoutCoupon } from '../../redux/types/checkout';
import { Tag, X, Check, Loader2, TicketPercent } from 'lucide-react';

interface CouponFormProps {
  couponApplied: CheckoutCoupon | null;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onRemoveCoupon: () => void;
  className?: string;
}

const CouponForm: React.FC<CouponFormProps> = ({ 
  couponApplied, 
  onApplyCoupon, 
  onRemoveCoupon,
  className = '' 
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onApplyCoupon(couponCode.toUpperCase());
      setCouponCode('');
    } catch (error: any) {
      setError(error.message || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setError(null);
    onRemoveCoupon();
  };

  // Helper function for currency formatting
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className={`bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Coupon Code</h3>
      </div>
      
      {couponApplied ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-fade-in relative overflow-hidden group">
          {/* Decorative background circle */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-100 rounded-full opacity-50 blur-xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <TicketPercent className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 flex items-center gap-2">
                  {couponApplied.code}
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 uppercase tracking-wider">Applied</span>
                </p>
                <p className="text-sm text-emerald-700 mt-1 font-medium">
                  {couponApplied.discountType === 'percentage' 
                    ? `Save ${couponApplied.discountAmount}% on this order` 
                    : `Save ${formatCurrency(couponApplied.discountAmount)} instantly`
                  }
                </p>
                <p className="text-xs text-emerald-600/80 mt-1 truncate max-w-[200px]">{couponApplied.name}</p>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              className="p-1.5 text-emerald-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
              title="Remove Coupon"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleApply} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Enter code"
                  className={`w-full bg-slate-50 border rounded-lg pl-3 pr-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all outline-none uppercase tracking-wide ${
                    error 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  disabled={loading}
                />
                {error && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500">
                    <X className="w-4 h-4" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!couponCode.trim() || loading}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 min-w-[80px] flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            
            {error && (
              <p className="text-rose-500 text-xs mt-2 ml-1 font-medium animate-shake flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                {error}
              </p>
            )}
          </form>
          
        </>
      )}
    </div>
  );
};

export default CouponForm;