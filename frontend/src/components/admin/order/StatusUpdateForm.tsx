// src/components/admin/orders/StatusUpdateForm.tsx

import React, { useState } from 'react';
import { Order, OrderStatusUpdateData } from '../types/order';

interface StatusUpdateFormProps {
  order: Order;
  onStatusUpdate: (formData: OrderStatusUpdateData) => void;
}

const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({ order, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<OrderStatusUpdateData>({
    status: order.status,
    trackingNumber: order.shippingMethod.trackingNumber || '',
    carrier: order.shippingMethod.carrier || '',
    notes: '',
    sendNotification: true
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];

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

  const handleInputChange = (field: keyof OrderStatusUpdateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      await onStatusUpdate(formData);
      setFormData(prev => ({ ...prev, notes: '' })); // Clear notes after successful update
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const showTrackingFields = formData.status === 'shipped';
  const showDeliveryFields = formData.status === 'delivered';
  const canUpdateToDelivered = ['shipped', 'processing'].includes(order.status);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Update Order Status</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Select */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Order Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={order.status === 'delivered'} // Prevent changing delivered orders
          >
            {statusOptions.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={
                  (option.value === 'delivered' && !canUpdateToDelivered) ||
                  (order.status === 'delivered')
                }
              >
                {option.label}
                {option.value === 'delivered' && !canUpdateToDelivered ? ' (Only shipped orders can be delivered)' : ''}
                {order.status === 'delivered' ? ' (Order already delivered)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking Fields - Only show for shipped status */}
        {showTrackingFields && (
          <>
            <div>
              <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                Carrier
              </label>
              <select
                id="carrier"
                value={formData.carrier || ''}
                onChange={(e) => handleInputChange('carrier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={showTrackingFields}
              >
                {carrierOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                id="trackingNumber"
                value={formData.trackingNumber || ''}
                onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tracking number"
                required={showTrackingFields}
              />
            </div>
          </>
        )}

        {/* Delivery Confirmation - Only show for delivered status */}
        {showDeliveryFields && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Confirm Delivery
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Marking this order as delivered will:
                  </p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Update order status to "Delivered"</li>
                    <li>Record delivery timestamp</li>
                    <li>Start the return window period</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add internal notes about this status update..."
          />
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center">
          <input
            id="sendNotification"
            type="checkbox"
            checked={formData.sendNotification}
            onChange={(e) => handleInputChange('sendNotification', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="sendNotification" className="ml-2 block text-sm text-gray-700">
            Send notification email to customer
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUpdating || order.status === 'delivered'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
          {order.status === 'delivered' && ' (Order Delivered)'}
        </button>
      </form>
    </div>
  );
};

export default StatusUpdateForm;