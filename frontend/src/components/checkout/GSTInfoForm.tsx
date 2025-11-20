import React, { useState } from 'react';
import { GSTInfo } from '../../redux/types/checkout';

interface GSTInfoFormProps {
  gstInfo: GSTInfo | null;
  onSave: (gstInfo: GSTInfo) => void;
  onCancel: () => void;
}

const GSTInfoForm: React.FC<GSTInfoFormProps> = ({ gstInfo, onSave, onCancel }) => {
  const [formData, setFormData] = useState<GSTInfo>({
    gstNumber: gstInfo?.gstNumber || '',
    businessName: gstInfo?.businessName || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateGST = (gstNumber: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }
    
    if (formData.gstNumber && !formData.businessName) {
      newErrors.businessName = 'Business name is required when providing GST number';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof GSTInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-medium mb-4">GST Information</h3>
      <p className="text-sm text-gray-600 mb-4">
        Provide GST details for business purchases (optional)
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GST Number
          </label>
          <input
            type="text"
            value={formData.gstNumber}
            onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.gstNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 07AABCU9603R1ZM"
          />
          {errors.gstNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Format: 2-digit state code + 10-digit PAN + 3-digit entity code + 1-digit checksum
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.businessName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter registered business name"
          />
          {errors.businessName && (
            <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save GST Info
          </button>
        </div>
      </form>
    </div>
  );
};

export default GSTInfoForm;