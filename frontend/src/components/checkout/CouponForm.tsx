import React, { useState } from 'react';
import { CheckoutCoupon } from '../../redux/types/checkout';

interface CouponFormProps {
  couponApplied: CheckoutCoupon | null;
  onApplyCoupon: (couponCode: string) => void;
  onRemoveCoupon: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({ 
  couponApplied, 
  onApplyCoupon, 
  onRemoveCoupon 
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setLoading(true);
    try {
      await onApplyCoupon(couponCode.toUpperCase());
      setCouponCode('');
    } catch (error) {
      // Error is handled in the action
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-3">Apply Coupon</h3>
      
      {couponApplied ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-green-800">
                Coupon Applied: {couponApplied.code}
              </p>
              <p className="text-sm text-green-600">
                {couponApplied.name} - ₹{couponApplied.discountAmount} off
              </p>
            </div>
            <button
              onClick={onRemoveCoupon}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!couponCode.trim() || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CouponForm;