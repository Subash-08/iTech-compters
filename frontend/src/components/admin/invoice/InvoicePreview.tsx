// components/invoice/InvoicePreview.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  CustomerDetails, 
  InvoiceProduct, 
  InvoiceCustomProduct,
  InvoicePreBuiltPC, 
  InvoiceTotals 
} from '../types/invoice';
import { FileText, Download, Send, Save, Printer, Mail, ArrowLeft, Edit, Check, X } from 'lucide-react';

interface InvoicePreviewProps {
  customer: CustomerDetails;
  products: InvoiceProduct[];
  customProducts: InvoiceCustomProduct[];
  preBuiltPCs: InvoicePreBuiltPC[];
  totals: InvoiceTotals;
  notes: string;
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'cash' | 'card' | 'upi' | 'cod' | 'bank_transfer' | 'online';
  onBack: () => void;
  onGenerate: () => void;
  onSaveDraft: () => void;
  isGenerating: boolean;
  onUpdateProduct?: (index: number, updates: Partial<InvoiceProduct>) => void;
  onUpdateCustomProduct?: (index: number, updates: Partial<InvoiceCustomProduct>) => void;
  onUpdatePreBuiltPC?: (index: number, updates: Partial<InvoicePreBuiltPC>) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  customer,
  products,
  customProducts,
  preBuiltPCs,
  totals,
  notes,
  paymentStatus,
  paymentMethod,
  onBack,
  onGenerate,
  onSaveDraft,
  isGenerating,
  onUpdateProduct,
  onUpdateCustomProduct,
  onUpdatePreBuiltPC
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'product' | 'custom' | 'pc';
    index: number;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    quantity: 1,
    unitPrice: 0,
    gstPercentage: 18
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const invoiceDate = formatDate(new Date());
  const dueDate = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const paymentMethodLabels = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    cod: 'Cash on Delivery',
    bank_transfer: 'Bank Transfer',
    online: 'Online Payment'
  };

  const handleStartEdit = (type: 'product' | 'custom' | 'pc', index: number) => {
    let item;
    if (type === 'product') {
      item = products[index];
    } else if (type === 'custom') {
      item = customProducts[index];
    } else {
      item = preBuiltPCs[index];
    }

    setEditingItem({ type, index });
    setEditForm({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstPercentage: item.gstPercentage
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const updates = {
      quantity: editForm.quantity,
      unitPrice: editForm.unitPrice,
      gstPercentage: editForm.gstPercentage
    };

    if (editingItem.type === 'product' && onUpdateProduct) {
      onUpdateProduct(editingItem.index, updates);
    } else if (editingItem.type === 'custom' && onUpdateCustomProduct) {
      onUpdateCustomProduct(editingItem.index, updates);
    } else if (editingItem.type === 'pc' && onUpdatePreBuiltPC) {
      onUpdatePreBuiltPC(editingItem.index, updates);
    }

    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <p className="text-gray-600">Review and edit final invoice before generation</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isEditing 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Edit size={18} />
          {isEditing ? 'Editing Mode' : 'Edit Prices'}
        </button>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8">
        {/* Invoice Header */}
        <div className="mb-8 pb-6 border-b-2 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Company</h1>
              <p className="text-gray-600 mt-2">
                123 Business Street, City, State - 123456<br />
                Phone: +91 1234567890 | Email: info@yourcompany.com<br />
                GSTIN: 27AAAAA0000A1Z5 | Website: www.yourcompany.com
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-2">TAX INVOICE</div>
              <div className="text-sm text-gray-600">Invoice #: AUTO-GENERATED</div>
              <div className="text-sm text-gray-600">Date: {invoiceDate}</div>
              <div className="text-sm text-gray-600">Due Date: {dueDate}</div>
            </div>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{customer.name}</p>
              {customer.companyName && <p>{customer.companyName}</p>}
              {customer.address && <p className="text-gray-600">{customer.address}</p>}
              <div className="mt-2 space-y-1">
                <p className="text-sm">📱 {customer.mobile}</p>
                {customer.email && <p className="text-sm">✉️ {customer.email}</p>}
                {customer.gstin && <p className="text-sm">GSTIN: {customer.gstin}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Details:</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {paymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">{paymentMethodLabels[paymentMethod]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{invoiceDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left p-4 font-medium">#</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Qty</th>
                <th className="text-left p-4 font-medium">Unit Price</th>
                <th className="text-left p-4 font-medium">GST %</th>
                <th className="text-left p-4 font-medium">Total</th>
                {isEditing && <th className="text-left p-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {/* Regular Products */}
              {products.map((product, index) => {
                const isEditingThis = editingItem?.type === 'product' && editingItem.index === index;
                
                return (
                  <tr key={`product-${index}`} className="border-b hover:bg-gray-50">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                        {product.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {isEditingThis ? (
                      <>
                        <td className="p-4">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.unitPrice}
                            onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})}
                            className="w-32 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editForm.gstPercentage}
                            onChange={(e) => setEditForm({...editForm, gstPercentage: parseFloat(e.target.value) || 0})}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(editForm.quantity, editForm.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save changes"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{product.quantity}</td>
                        <td className="p-4">₹{product.unitPrice.toFixed(2)}</td>
                        <td className="p-4">{product.gstPercentage}%</td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}
                        </td>
                        {isEditing && (
                          <td className="p-4">
                            <button
                              onClick={() => handleStartEdit('product', index)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit item"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Custom Products */}
              {customProducts.map((product, index) => {
                const isEditingThis = editingItem?.type === 'custom' && editingItem.index === index;
                const displayIndex = products.length + index + 1;
                
                return (
                  <tr key={`custom-${index}`} className="border-b hover:bg-purple-50/30">
                    <td className="p-4">{displayIndex}</td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            Custom
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                        )}
                        {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                      </div>
                    </td>
                    
                    {isEditingThis ? (
                      <>
                        <td className="p-4">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.unitPrice}
                            onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})}
                            className="w-32 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editForm.gstPercentage}
                            onChange={(e) => setEditForm({...editForm, gstPercentage: parseFloat(e.target.value) || 0})}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(editForm.quantity, editForm.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save changes"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{product.quantity}</td>
                        <td className="p-4">₹{product.unitPrice.toFixed(2)}</td>
                        <td className="p-4">{product.gstPercentage}%</td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(product.quantity, product.unitPrice).toFixed(2)}
                        </td>
                        {isEditing && (
                          <td className="p-4">
                            <button
                              onClick={() => handleStartEdit('custom', index)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit item"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Pre-built PCs */}
              {preBuiltPCs.map((pc, index) => {
                const isEditingThis = editingItem?.type === 'pc' && editingItem.index === index;
                const displayIndex = products.length + customProducts.length + index + 1;
                
                return (
                  <tr key={`pc-${index}`} className="border-b hover:bg-blue-50/30">
                    <td className="p-4">{displayIndex}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{pc.name}</p>
                        <p className="text-sm text-blue-600">Pre-built PC</p>
                        {pc.components.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            Includes: {pc.components.slice(0, 2).map(c => c.name).join(', ')}
                            {pc.components.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {isEditingThis ? (
                      <>
                        <td className="p-4">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.unitPrice}
                            onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})}
                            className="w-32 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editForm.gstPercentage}
                            onChange={(e) => setEditForm({...editForm, gstPercentage: parseFloat(e.target.value) || 0})}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(editForm.quantity, editForm.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save changes"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{pc.quantity}</td>
                        <td className="p-4">₹{pc.unitPrice.toFixed(2)}</td>
                        <td className="p-4">{pc.gstPercentage}%</td>
                        <td className="p-4 font-medium">
                          ₹{calculateItemTotal(pc.quantity, pc.unitPrice).toFixed(2)}
                        </td>
                        {isEditing && (
                          <td className="p-4">
                            <button
                              onClick={() => handleStartEdit('pc', index)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit item"
                            >
                              <Edit size={18} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Empty State */}
              {products.length === 0 && customProducts.length === 0 && preBuiltPCs.length === 0 && (
                <tr>
                  <td colSpan={isEditing ? 7 : 6} className="p-8 text-center text-gray-500">
                    No items added to invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Notes */}
          <div className="md:col-span-2">
            <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
              {notes || 'No notes added'}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• This is a quotation/price estimate for reference</li>
                <li>• Prices are subject to change without notice</li>
                <li>• All prices include GST as applicable</li>
                <li>• Valid for 30 days from the date of issue</li>
              </ul>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600 font-medium">-₹{totals.discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">₹{totals.shipping.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total GST</span>
                <span className="font-medium">₹{totals.totalGst.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-blue-700">
                    ₹{totals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>Thank you for your interest in our products!</p>
          <p className="mt-1">This document is for quotation/estimation purposes only</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Edit
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isGenerating}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            Save Draft
          </button>
          
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || editingItem !== null}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText size={20} />
                Generate & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;