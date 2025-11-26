// Enhanced CouponForm component
import React, { useState } from 'react';
import { CheckoutCoupon } from '../../redux/types/checkout';

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

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-3">Apply Coupon</h3>
      
      {couponApplied ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-green-800">
                Coupon Applied: {couponApplied.code}
              </p>
              <p className="text-sm text-green-600">
                {couponApplied.name} - 
                {couponApplied.discountType === 'percentage' 
                  ? ` ${couponApplied.discountAmount} Rs off` 
                  : ` ${formatCurrency(couponApplied.discountAmount)} off`
                }
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              disabled={loading}
            >
              {loading ? '...' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={handleApply} className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setError(null);
                }}
                placeholder="Enter coupon code"
                className={`w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {error && (
                <p className="text-red-600 text-xs mt-1">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!couponCode.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Applying...</span>
                </>
              ) : (
                'Apply'
              )}
            </button>
          </form>
          
          {/* Popular coupons suggestion */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Popular coupons:</p>
            <div className="flex flex-wrap gap-2">
              {['WELCOME10', 'SAVE20', 'FREESHIP'].map((code) => (
                <button
                  key={code}
                  onClick={() => setCouponCode(code)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Helper function for currency formatting
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
};

export default CouponForm;