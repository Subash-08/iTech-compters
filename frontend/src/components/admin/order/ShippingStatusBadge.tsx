// src/components/admin/orders/ShippingStatusBadge.tsx

import React from 'react';

interface ShippingStatusBadgeProps {
  status: string;
  deliveredAt?: Date;
}

const ShippingStatusBadge: React.FC<ShippingStatusBadgeProps> = ({ status, deliveredAt }) => {
  const getStatusConfig = (status: string, isDelivered: boolean) => {
    if (isDelivered) {
      return { color: 'bg-green-100 text-green-800', label: 'Delivered' };
    }

    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      processing: { color: 'bg-indigo-100 text-indigo-800', label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    return config[status as keyof typeof config] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: status 
    };
  };

  const isDelivered = deliveredAt !== undefined;
  const { color, label } = getStatusConfig(status, isDelivered);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
      {isDelivered && (
        <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );
};

export default ShippingStatusBadge;