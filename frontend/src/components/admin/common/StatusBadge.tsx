import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
};

export default StatusBadge;