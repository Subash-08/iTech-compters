// src/components/admin/orders/ShippingUpdateForm.tsx

import React, { useState } from 'react';
import { Order, ShippingUpdateData } from '../types/order';

interface ShippingUpdateFormProps {
  order: Order;
  onShippingUpdate: (formData: ShippingUpdateData) => void;
}

const ShippingUpdateForm: React.FC<ShippingUpdateFormProps> = ({ order, onShippingUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<ShippingUpdateData>({
    trackingNumber: order.shippingMethod.trackingNumber || '',
    carrier: order.shippingMethod.carrier || '',
    sendNotification: true
  });

  const carrierOptions = [
    { value: '', label: 'Select Carrier' },
    { value: 'delhivery', label: 'Delhivery' },
    { value: 'bluedart', label: 'Blue Dart' },
    { value: 'dtdc', label: 'DTDC' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'ups', label: 'UPS' },
    { value: 'india-post', label: 'India Post' },
    { value: 'ekart', label: 'Ekart' },
    { value: 'xpressbees', label: 'XpressBees' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field: keyof ShippingUpdateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trackingNumber || !formData.carrier) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      await onShippingUpdate(formData);
    } catch (error) {
      console.error('Error updating shipping info:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const canUpdateShipping = ['confirmed', 'processing', 'shipped'].includes(order.status);

  if (!canUpdateShipping) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Information</h3>
        <p className="text-sm text-gray-500">
          Shipping information can only be updated for confirmed, processing, or shipped orders.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Update Shipping Information</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Carrier Selection */}
        <div>
          <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
            Carrier *
          </label>
          <select
            id="carrier"
            value={formData.carrier}
            onChange={(e) => handleInputChange('carrier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {carrierOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking Number */}
        <div>
          <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Tracking Number *
          </label>
          <input
            type="text"
            id="trackingNumber"
            value={formData.trackingNumber}
            onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tracking number"
            required
          />
        </div>

        {/* Current Shipping Info */}
        {order.shippingMethod.trackingNumber && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Shipping Info</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Carrier: {order.shippingMethod.carrier}</p>
              <p>Tracking: {order.shippingMethod.trackingNumber}</p>
              <p>Method: {order.shippingMethod.name}</p>
              <p>Estimated Delivery: {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>
        )}

        {/* Shipping Events */}
        {order.shippingEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Events</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {order.shippingEvents.map((event, index) => (
                <div key={event._id || index} className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-medium">{event.event}</div>
                  <div className="text-gray-500">{event.description}</div>
                  <div className="text-gray-400">
                    {new Date(event.timestamp).toLocaleDateString()} • {event.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Toggle */}
        <div className="flex items-center">
          <input
            id="shipping-sendNotification"
            type="checkbox"
            checked={formData.sendNotification}
            onChange={(e) => handleInputChange('sendNotification', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="shipping-sendNotification" className="ml-2 block text-sm text-gray-700">
            Send tracking notification to customer
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUpdating || !formData.trackingNumber || !formData.carrier}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Update Shipping Info'}
        </button>
      </form>
    </div>
  );
};

export default ShippingUpdateForm;