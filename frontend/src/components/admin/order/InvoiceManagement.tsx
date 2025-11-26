// src/components/admin/orders/InvoiceManagement.tsx
import React, { useState, useRef, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { InvoiceResponse } from '../types/order';

interface InvoiceManagementProps {
  orderId: string;
  orderNumber: string;
  onInvoiceUpdate: () => void;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  orderId,
  orderNumber,
  onInvoiceUpdate,
}) => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`ADMIN-${orderNumber}`);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderInvoices(orderId);
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Upload admin invoice
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('invoice', selectedFile);
      formData.append('invoiceNumber', invoiceNumber);
      if (notes) {
        formData.append('notes', notes);
      }

      await orderService.uploadAdminInvoice(orderId, formData);
      
      // Reset form
      setSelectedFile(null);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert('Invoice uploaded successfully!');
      onInvoiceUpdate();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      alert(error.response?.data?.message || 'Failed to upload invoice');
    } finally {
      setUploading(false);
    }
  };

  // Generate auto invoice
  const handleGenerateAutoInvoice = async () => {
    try {
      setLoading(true);
      await orderService.generateAutoInvoice(orderId);
      alert('Auto invoice generated successfully!');
      onInvoiceUpdate();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      alert(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  // Delete admin invoice
  const handleDeleteAdminInvoice = async () => {
    if (!confirm('Are you sure you want to delete the admin uploaded invoice?')) {
      return;
    }

    try {
      setLoading(true);
      await orderService.deleteAdminInvoice(orderId);
      alert('Admin invoice deleted successfully!');
      onInvoiceUpdate();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert(error.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  // Download invoice
  const handleDownload = async (invoiceType: 'auto' | 'admin', invoiceNumber: string) => {
    try {
      const response = await orderService.downloadInvoice(orderId, invoiceType);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  // Load invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, [orderId]);

  const hasAutoInvoice = invoices.some(inv => inv.type === 'auto_generated');
  const hasAdminInvoice = invoices.some(inv => inv.type === 'admin_uploaded');
  const adminInvoice = invoices.find(inv => inv.type === 'admin_uploaded');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Invoice Management</h3>

      {/* Current Invoices */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Available Invoices</h4>
        {loading ? (
          <p className="text-gray-500">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500">No invoices available</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.type === 'auto_generated' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {invoice.type === 'auto_generated' ? 'System' : 'Admin'}
                    </span>
                    <p className="font-medium text-sm">
                      {invoice.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {invoice.invoiceNumber} • 
                    {invoice.type === 'auto_generated' && invoice.generatedAt
                      ? ` Generated: ${new Date(invoice.generatedAt).toLocaleDateString()}`
                      : invoice.uploadedAt
                      ? ` Uploaded: ${new Date(invoice.uploadedAt).toLocaleDateString()}`
                      : ''
                    }
                  </p>
                  {invoice.notes && (
                    <p className="text-xs text-gray-600 mt-1">{invoice.notes}</p>
                  )}
                  {invoice.uploadedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      By: {invoice.uploadedBy.firstName} {invoice.uploadedBy.lastName}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(
                      invoice.type === 'auto_generated' ? 'auto' : 'admin',
                      invoice.invoiceNumber
                    )}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </button>
                  {invoice.type === 'admin_uploaded' && (
                    <button
                      onClick={handleDeleteAdminInvoice}
                      className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Auto Invoice */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Generate System Invoice</h4>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGenerateAutoInvoice}
            disabled={loading || hasAutoInvoice}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              hasAutoInvoice
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Generating...' : hasAutoInvoice ? 'Already Generated' : 'Generate Auto Invoice'}
          </button>
          {hasAutoInvoice && (
            <span className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Auto invoice available
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          System-generated invoices are automatically created when payment is successful. 
          You can manually generate one here if needed.
        </p>
      </div>

      {/* Upload Admin Invoice */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Upload Custom Invoice</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter invoice number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this invoice..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF File *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Only PDF files are allowed. Maximum size: 5MB
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                Selected file: {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !invoiceNumber}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploading || !selectedFile || !invoiceNumber
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload Invoice'
              )}
            </button>

            {hasAdminInvoice && (
              <span className="text-sm text-yellow-700 flex items-center px-3 py-2 bg-yellow-50 rounded-md">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Uploading will replace existing admin invoice
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;