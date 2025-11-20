import React from 'react';

interface CheckoutStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const CheckoutStep: React.FC<CheckoutStepProps> = ({ title, description, children }) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
};

export default CheckoutStep;