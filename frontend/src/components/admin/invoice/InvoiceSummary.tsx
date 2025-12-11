// components/invoice/InvoiceSummary.tsx - FIXED VERSION (No Payment)
import React from 'react';
import { 
  CustomerDetails, 
  InvoiceProduct, 
  InvoiceCustomProduct,
  InvoiceTotals 
} from '../types/invoice';
import { FileText, Calculator, Percent, Truck, MessageSquare } from 'lucide-react';

interface InvoiceSummaryProps {
  customer: CustomerDetails;
  products: InvoiceProduct[];
  customProducts: InvoiceCustomProduct[];
  totals: InvoiceTotals;
  discount: number;
  shipping: number;
  notes: string;
  onDiscountChange: (value: number) => void;
  onShippingChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  customer,
  products,
  customProducts,
  totals,
  discount,
  shipping,
  notes,
  onDiscountChange,
  onShippingChange,
  onNotesChange,
  onBack,
  onNext
}) => {
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateItemGST = (quantity: number, unitPrice: number, gstPercentage: number) => {
    return (quantity * unitPrice) * (gstPercentage / 100);
  };

  const getTotalItems = () => {
    return products.length + customProducts.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Invoice Summary</h1>
            <p className="opacity-90 mt-1">Review and finalize your invoice</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
            <Calculator size={20} />
            <span className="font-semibold">{getTotalItems()} items • ₹{totals.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">C</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Customer Details</h2>
                <p className="text-sm text-gray-600">Review customer information</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Name</p>
                <p className="font-medium text-gray-900 mt-1">{customer.name}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-medium">Mobile</p>
                <p className="font-medium text-gray-900 mt-1">{customer.mobile}</p>
              </div>
              {customer.email && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                  <p className="font-medium text-gray-900 mt-1">{customer.email}</p>
                </div>
              )}
              {customer.companyName && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Company</p>
                  <p className="font-medium text-gray-900 mt-1">{customer.companyName}</p>
                </div>
              )}
              {customer.gstin && (
                <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">GSTIN</p>
                  <p className="font-medium text-gray-900 mt-1">{customer.gstin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Items Summary</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    Products: {products.length}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                    Custom: {customProducts.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="divide-y">
              {/* Products */}
              {products.map((product, index) => {
                const itemTotal = calculateItemTotal(product.quantity, product.unitPrice);
                const itemGST = calculateItemGST(product.quantity, product.unitPrice, product.gstPercentage);
                
                return (
                  <div key={`product-${index}`} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold">P</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            {product.sku && (
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-gray-600">
                                Qty: {product.quantity}
                              </span>
                              <span className="text-sm text-gray-600">
                                Price: ₹{product.unitPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-600">
                                GST: {product.gstPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">
                          ₹{itemTotal.toFixed(2)}
                        </p>
                        {product.gstPercentage > 0 && (
                          <p className="text-sm text-gray-600">
                            + GST: ₹{itemGST.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Products */}
              {customProducts.map((product, index) => {
                const itemTotal = calculateItemTotal(product.quantity, product.unitPrice);
                const itemGST = calculateItemGST(product.quantity, product.unitPrice, product.gstPercentage);
                
                return (
                  <div key={`custom-${index}`} className="px-6 py-4 hover:bg-purple-50/30 bg-purple-50/30">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-semibold">C</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                Custom
                              </span>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-gray-600">
                                Qty: {product.quantity}
                              </span>
                              <span className="text-sm text-gray-600">
                                Price: ₹{product.unitPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-600">
                                GST: {product.gstPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-lg">
                          ₹{itemTotal.toFixed(2)}
                        </p>
                        {product.gstPercentage > 0 && (
                          <p className="text-sm text-gray-600">
                            + GST: ₹{itemGST.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Totals */}
        <div className="space-y-6">
          {/* Adjustments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent size={20} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Adjustments</h2>
                <p className="text-sm text-gray-600">Add discounts & shipping</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span>🎁</span>
                    Discount Amount (₹)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Shipping */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Truck size={16} />
                    Shipping Charges (₹)
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping}
                    onChange={(e) => onShippingChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Invoice Totals</h2>
                <p className="text-sm text-gray-600">Final amount breakdown</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">₹{totals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600 font-medium">-₹{totals.discount.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">₹{totals.shipping.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-600">Total GST</span>
                <span className="font-medium text-gray-900">₹{totals.totalGst.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium text-gray-900">₹{totals.roundOff.toFixed(2)}</span>
              </div>
              
              <div className="pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-blue-700">
                    ₹{totals.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Notes & Terms</h2>
            <p className="text-sm text-gray-600">Add comments or special instructions</p>
          </div>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any notes, terms, or special instructions for this invoice..."
        />
        
        <div className="mt-4 text-sm text-gray-500">
          <p>💡 <strong>Tip:</strong> Include delivery instructions, warranty details, or payment terms.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          ← Back to Products
        </button>
        
        <button
          type="button"
          onClick={onNext}
          disabled={getTotalItems() === 0}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <FileText size={20} />
          Preview Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceSummary;