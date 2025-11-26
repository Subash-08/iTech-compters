// Enhanced OrderSummary component
import React from 'react';
import { CheckoutCoupon } from '../../redux/types/checkout';

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
  onRemoveCoupon
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-4">Order Summary</h3>
      
      {/* Coupon Section */}
      {onApplyCoupon && onRemoveCoupon && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          {coupon ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-green-800 text-sm">
                  Coupon Applied: {coupon.code}
                </p>
                <p className="text-xs text-green-600">
                  {coupon.discountType === 'percentage' 
                    ? `${coupon.discountAmount}% off` 
                    : `${formatCurrency(coupon.discountAmount)} off`
                  }
                </p>
              </div>
              <button
                onClick={onRemoveCoupon}
                className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 border border-red-200 rounded"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Have a coupon code?</p>
              <button 
                onClick={() => {/* Trigger coupon modal */}}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Apply Coupon
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Items ({itemCount})</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-green-600' : ''}>
            {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Tax (GST)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        
        {coupon && discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({coupon.code})</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        
        <hr className="my-3" />
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        
        {subtotal < 1000 && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-lg mt-3">
            Add {formatCurrency(1000 - subtotal)} more for FREE shipping!
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;