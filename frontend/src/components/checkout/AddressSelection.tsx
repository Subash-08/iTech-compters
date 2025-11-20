import React from 'react';
import { CheckoutAddress } from '../../redux/types/checkout';

interface AddressSelectionProps {
  addresses: CheckoutAddress[];
  selectedAddress: string | null;
  onSelectAddress: (addressId: string) => void;
  onAddNewAddress: () => void;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Shipping Address</h3>
      
      <div className="grid gap-4">
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedAddress === address._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectAddress(address._id!)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">
                    {address.firstName} {address.lastName}
                  </span>
                  {address.isDefault && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                  <span className="text-gray-500 text-sm capitalize">
                    {address.type}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                </p>
                <p className="text-gray-600 text-sm">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-gray-600 text-sm">
                  {address.country}
                </p>
                {address.landmark && (
                  <p className="text-gray-500 text-sm">
                    Landmark: {address.landmark}
                  </p>
                )}
                
                <div className="mt-2 text-sm text-gray-600">
                  <p>📞 {address.phone}</p>
                  <p>✉️ {address.email}</p>
                </div>
              </div>
              
              <div className="ml-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAddress === address._id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedAddress === address._id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={onAddNewAddress}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <div className="flex items-center justify-center space-x-2">
          <span>+</span>
          <span>Add New Address</span>
        </div>
      </button>
    </div>
  );
};

export default AddressSelection;