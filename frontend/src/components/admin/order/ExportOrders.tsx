// src/components/admin/orders/ExportOrders.tsx

import React, { useState } from 'react';
import { orderService } from '../services/orderService';

const ExportOrders: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await orderService.exportOrders(
        exportFormat,
        dateRange.startDate || undefined,
        dateRange.endDate || undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting orders:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const canExport = !isExporting && (!dateRange.startDate || !dateRange.endDate || dateRange.startDate <= dateRange.endDate);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Orders</h2>
      
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value as 'csv')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">CSV</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value as 'json')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">JSON</span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!canExport}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
        </button>

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          <p>• CSV format is recommended for spreadsheet applications</p>
          <p>• JSON format includes all order details</p>
          <p>• Leave date range empty to export all orders</p>
        </div>
      </div>
    </div>
  );
};

export default ExportOrders;