// src/components/admin/orders/OrderTimeline.tsx

import React from 'react';
import { TimelineEvent } from '../types/order';

interface OrderTimelineProps {
  timeline: TimelineEvent[];
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline = [] }) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  const getEventIcon = (event: string) => {
    const icons: Record<string, string> = {
      order_created: '🆕',
      payment_processed: '💳',
      status_updated: '🔄',
      order_shipped: '🚚',
      order_delivered: '📦',
      order_cancelled: '❌',
      admin_note_added: '📝',
      refund_processed: '💸',
      payment_attempted: '💰',
      payment_failed: '❌',
      payment_captured: '✅'
    };

    return icons[event] || '⚡';
  };

  const safeTimeline = Array.isArray(timeline) ? timeline : [];

  if (safeTimeline.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <p className="text-gray-500">No timeline events available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Order Timeline</h3>
      </div>
      
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {safeTimeline.map((event, eventIdx) => {
              // Safe event data extraction
              const eventId = event._id || `event-${eventIdx}`;
              const eventType = event.event || 'unknown_event';
              const eventMessage = event.message || 'No description';
              const eventTimestamp = event.changedAt || event.timestamp;
              const changedBy = event.changedBy;
              const metadata = event.metadata || {};

              return (
                <li key={eventId}>
                  <div className="relative pb-8">
                    {eventIdx !== safeTimeline.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white text-sm">
                          {getEventIcon(eventType)}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700">
                            {eventMessage}
                          </p>
                          {changedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              By: {changedBy.firstName} {changedBy.lastName}
                            </p>
                          )}
                          {metadata && Object.keys(metadata).length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {Object.entries(metadata).map(([key, value]) => (
                                <div key={key}>
                                  <strong>{key}:</strong> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          {formatDate(eventTimestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;