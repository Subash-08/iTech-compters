// components/invoice/CustomProductForm.tsx
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { InvoiceCustomProduct } from '../types/invoice';

interface CustomProductFormProps {
  onAddCustomProduct: (product: InvoiceCustomProduct) => void;
}

const CustomProductForm: React.FC<CustomProductFormProps> = ({ onAddCustomProduct }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    gstPercentage: 18,
    category: '',
    sku: '',
    hsnCode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = formData.quantity * formData.unitPrice;
    const gstAmount = total * (formData.gstPercentage / 100);
    
    const customProduct: InvoiceCustomProduct = {
      ...formData,
      total,
      gstAmount,
      isCustom: true
    };
    
    onAddCustomProduct(customProduct);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      gstPercentage: 18,
      category: '',
      sku: '',
      hsnCode: ''
    });
    setShowForm(false);
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors mb-4"
      >
        <Plus size={18} />
        {showForm ? 'Cancel Custom Product' : 'Add Custom Product/Service'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product/Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter product or service name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., Service, Hardware, Software"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Product/Service description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Optional)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., CUST-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={formData.gstPercentage}
                onChange={(e) => setFormData({...formData, gstPercentage: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HSN Code (Optional)
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., 8471"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add to Invoice
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomProductForm;