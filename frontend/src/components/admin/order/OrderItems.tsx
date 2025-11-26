// src/components/admin/orders/OrderItems.tsx

import React from 'react';
import { OrderItem, Pricing } from '../types/order';

interface OrderItemsProps {
  items: OrderItem[];
  pricing: Pricing;
}

const OrderItems: React.FC<OrderItemsProps> = ({ items, pricing }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getProductDisplay = (item: OrderItem) => {
    // If product is populated as an object
    if (typeof item.product === 'object' && item.product !== null) {
      return {
        name: item.product.name || item.name,
        image: item.product.images?.[0] || item.image,
        slug: item.product.slug,
        category: item.product.category
      };
    }
    
    // If product is just an ID (not populated)
    return {
      name: item.name,
      image: item.image,
      slug: undefined,
      category: undefined
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {items.map((item) => {
            const productDisplay = getProductDisplay(item);
            const unitPrice = item.discountedPrice || item.originalPrice;
            const total = item.total || unitPrice * item.quantity;
            const hasDiscount = item.originalPrice > item.discountedPrice;

            return (
              <div key={item._id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4 flex-1">
                  {productDisplay.image ? (
                    <img
                      src={productDisplay.image}
                      alt={productDisplay.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {productDisplay.name}
                    </h4>
                    
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                        {item.productType}
                      </span>
                      <span className="text-sm text-gray-500">
                        SKU: {item.sku || 'N/A'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </span>
                    </div>

                    {item.variant && item.variant.identifyingAttributes && item.variant.identifyingAttributes.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {item.variant.identifyingAttributes.map((attr, index) => (
                          <div key={index} className="flex">
                            <span className="font-medium w-20 shrink-0">{attr.label}:</span>
                            <span className="truncate">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(total)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(unitPrice)} each
                  </p>
                  {hasDiscount && (
                    <p className="text-xs text-green-600 line-through">
                      {formatCurrency(item.originalPrice)} each
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(pricing.subtotal)}</span>
            </div>
            
            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-{formatCurrency(pricing.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">{formatCurrency(pricing.shipping)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">{formatCurrency(pricing.tax)}</span>
            </div>
            
            <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(pricing.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItems;