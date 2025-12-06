import React, { useState } from 'react';
import { CheckoutAddress } from '../../redux/types/checkout';
import AddressForm from './AddressForm';

interface AddressSelectionProps {
  addresses: CheckoutAddress[];
  selectedAddress: string | null;
  onSelectAddress: (addressId: string) => void;
  onAddNewAddress: () => void;
  onUpdateAddress: (addressId: string, addressData: any, setAsDefault?: boolean) => Promise<void>;
  onDeleteAddress: (addressId: string) => Promise<void>;
   refreshing?: boolean;
}

const AddressSelection: React.FC<AddressSelectionProps> = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddNewAddress,
  onUpdateAddress,
  onDeleteAddress,
  refreshing = false
}) => {
  const [editingAddress, setEditingAddress] = useState<CheckoutAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const handleEditAddress = (address: CheckoutAddress) => {
    setEditingAddress(address);
  };

  const handleSaveEdit = async (addressData: any, setAsDefault?: boolean) => {
    if (editingAddress?._id) {
      await onUpdateAddress(editingAddress._id, addressData, setAsDefault);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingAddressId(addressId);
    try {
      await onDeleteAddress(addressId);
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
  };

  // If editing an address, show the form
  if (editingAddress) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Edit Address</h3>
        <AddressForm
          initialData={editingAddress}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
            {refreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Updating addresses...</p>
          </div>
        </div>
      )}
      <h3 className="text-lg font-medium">
        Select Shipping Address {selectedAddress && '✅'}
      </h3>
      
      {/* Debug info */}
      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <p>Found {addresses.length} addresses | Selected: {selectedAddress || 'None'}</p>
      </div>
      
      <div className="grid gap-4">
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`border rounded-lg p-4 transition-all ${
              selectedAddress === address._id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onSelectAddress(address._id!)}
              >
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
                  {selectedAddress === address._id && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Selected ✅
                    </span>
                  )}
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
              
              <div className="ml-4 flex flex-col items-center space-y-2">
                {/* Selection Radio */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                    selectedAddress === address._id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                  onClick={() => onSelectAddress(address._id!)}
                >
                  {selectedAddress === address._id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                {/* Edit/Delete Buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="text-blue-600 hover:text-blue-800 text-sm p-1"
                    title="Edit address"
                  >
                    ✏️
                  </button>
                  
                  {addresses.length > 1 && ( // Don't allow delete if only one address
                    <button
                      onClick={() => handleDeleteAddress(address._id!)}
                      disabled={deletingAddressId === address._id}
                      className="text-red-600 hover:text-red-800 text-sm p-1 disabled:opacity-50"
                      title="Delete address"
                    >
                      {deletingAddressId === address._id ? '🗑️⏳' : '🗑️'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add New Address Button */}
      <button
        onClick={onAddNewAddress}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors group"
      >
        <div className="flex items-center justify-center space-x-3">
          <span className="text-2xl group-hover:text-blue-600">+</span>
          <span className="font-medium group-hover:text-blue-600">Add New Address</span>
        </div>
      </button>
    </div>
  );
};

export default AddressSelection;