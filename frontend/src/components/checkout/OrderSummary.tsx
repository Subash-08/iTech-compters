// Enhanced OrderSummary component with debugging
import React, { useEffect } from 'react';
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
  debugMode?: boolean; // Add debug mode prop
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
  debugMode = true // Enable debug by default
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Debug effect to log pricing details
  useEffect(() => {
    if (debugMode) {
      console.group('💰 ORDER SUMMARY DEBUG');
      console.log('📊 Pricing Breakdown:', {
        subtotal,
        shipping,
        tax,
        discount,
        total,
        itemCount
      });
      
      // Tax calculation verification
      const expectedTax = Math.round(subtotal * 0.18);
      const taxCalculationCorrect = Math.abs(tax - expectedTax) <= 1; // Allow 1 rupee difference for rounding
      
console.log('🧾 Tax Calculation:', {
  'Subtotal': subtotal,
  'Actual Tax from Backend': tax,
  'Actual Tax Rate': ((tax / subtotal) * 100).toFixed(2) + '%'
});

      // Total calculation verification
      const expectedTotal = subtotal + shipping + tax - discount;
      const totalCalculationCorrect = Math.abs(total - expectedTotal) <= 1;
      
      console.log('🧮 Total Calculation Check:', {
        'Subtotal': subtotal,
        '+ Shipping': shipping,
        '+ Tax': tax,
        '- Discount': discount,
        'Expected Total': expectedTotal,
        'Actual Total': total,
        'Total Calculation': totalCalculationCorrect ? '✅ Correct' : '❌ Incorrect',
        'Difference': total - expectedTotal
      });

      console.groupEnd();
    }
  }, [subtotal, shipping, tax, discount, total, itemCount, debugMode]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-4">Order Summary</h3>
      
      {/* Debug Info - Only show in debug mode */}
      {debugMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-blue-800">🔍 Debug Info</h4>
            <span className={`text-xs px-2 py-1 rounded ${
              Math.abs(total - (subtotal + shipping + tax - discount)) <= 1 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {Math.abs(total - (subtotal + shipping + tax - discount)) <= 1 ? '✅ Valid' : '❌ Invalid'}
            </span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>Subtotal: ₹{subtotal.toFixed(2)}</div>
            <div>Shipping: ₹{shipping.toFixed(2)}</div>
            <div>Tax: ₹{tax.toFixed(2)}</div>
            <div>Discount: -₹{discount.toFixed(2)}</div>
            <div className="font-semibold">Calculated: ₹{(subtotal + shipping + tax - discount).toFixed(2)}</div>
          </div>
        </div>
      )}
      
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