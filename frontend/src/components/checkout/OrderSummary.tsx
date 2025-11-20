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
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  shipping,
  tax,
  discount,
  total,
  coupon,
  itemCount,
  currency
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-4">Order Summary</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Items ({itemCount})</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-green-600' : ''}>
            {shipping === 0 ? 'FREE' : `${currency} ${shipping.toFixed(2)}`}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Tax (GST)</span>
          <span>{currency} {tax.toFixed(2)}</span>
        </div>
        
        {coupon && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount ({coupon.code})</span>
            <span>-{currency} {discount.toFixed(2)}</span>
          </div>
        )}
        
        <hr className="my-3" />
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{currency} {total.toFixed(2)}</span>
        </div>
        
        {subtotal < 1000 && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-lg mt-3">
            Add {currency} {(1000 - subtotal).toFixed(2)} more for FREE shipping!
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;