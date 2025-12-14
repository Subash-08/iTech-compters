import React, { useState } from 'react';
import { CheckoutAddress } from '../../redux/types/checkout';
import AddressForm from './AddressForm';
import { Edit2, Trash2, MapPin, Phone, Mail, Plus, Check, Loader2, Home, Briefcase } from 'lucide-react';

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

  const handleEditAddress = (address: CheckoutAddress, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking edit
    setEditingAddress(address);
  };

  const handleSaveEdit = async (addressData: any, setAsDefault?: boolean) => {
    if (editingAddress?._id) {
      await onUpdateAddress(editingAddress._id, addressData, setAsDefault);
      setEditingAddress(null);
    }
  };

  const handleDeleteClick = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete
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

  // Icon Helper
  const getAddressIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'home': return <Home className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  // If editing an address, show the form
  if (editingAddress) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-600" />
          Edit Address
        </h3>
        <AddressForm
          initialData={editingAddress}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Loading Overlay */}
      {refreshing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-xl transition-all duration-300">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Updating...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">
          Saved Addresses
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {addresses.length} saved
        </span>
      </div>
      
      {/* Address Grid */}
      <div className="grid grid-cols-1 gap-4">
        {addresses.map((address) => {
          const isSelected = selectedAddress === address._id;
          const isDeleting = deletingAddressId === address._id;

          return (
            <div
              key={address._id}
              onClick={() => !isDeleting && onSelectAddress(address._id!)}
              className={`group relative border rounded-xl p-5 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex items-start gap-4">
                
                {/* Radio Indicator */}
                <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors duration-200 shrink-0 ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 truncate">
                        {address.firstName} {address.lastName}
                      </h4>
                      <div className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700 border-blue-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {getAddressIcon(address.type)}
                        {address.type}
                      </div>
                      {address.isDefault && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="text-sm text-slate-600 leading-relaxed mb-3 pr-8">
                    <p className="line-clamp-1">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="line-clamp-1">{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state} <span className="text-slate-400">•</span> <span className="font-mono text-slate-700">{address.pincode}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-medium">{address.country}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {address.phone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{address.email}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (Absolute positioned for cleaner layout) */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleEditAddress(address, e)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit address"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {addresses.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteClick(address._id!, e)}
                      disabled={deletingAddressId === address._id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete address"
                    >
                      {deletingAddressId === address._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Add New Address Button (Styled to look distinct) */}
      <button
        onClick={onAddNewAddress}
        className="w-full group relative overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300"
      >
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:border-blue-200 transition-transform duration-300">
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
          </div>
          <span className="font-semibold text-slate-600 group-hover:text-blue-700">Add New Address</span>
        </div>
      </button>
    </div>
  );
};

export default AddressSelection;