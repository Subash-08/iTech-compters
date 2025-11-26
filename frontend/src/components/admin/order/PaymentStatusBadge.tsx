// src/components/admin/orders/PaymentStatusBadge.tsx

import React from 'react';

interface PaymentStatusBadgeProps {
  status: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const config = {
      created: { color: 'bg-gray-100 text-gray-800', label: 'Created' },
      attempted: { color: 'bg-yellow-100 text-yellow-800', label: 'Attempted' },
      captured: { color: 'bg-green-100 text-green-800', label: 'Captured' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
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

export default PaymentStatusBadge;