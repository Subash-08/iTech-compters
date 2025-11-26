// src/components/admin/orders/StatusBadge.tsx

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      processing: { color: 'bg-indigo-100 text-indigo-800', label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    };

    return config[status as keyof typeof config] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: status 
    };
  };

  const { color, label } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

export default StatusBadge;