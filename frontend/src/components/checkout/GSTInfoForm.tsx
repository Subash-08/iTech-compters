import React, { useState } from 'react';
import { GSTInfo } from '../../redux/types/checkout';
import { Building2, FileText, Info } from 'lucide-react';

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
    // 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, 'Z', 1 alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST format (e.g. 07AABCU9603R1ZM)';
    }
    
    if (formData.gstNumber && !formData.businessName) {
      newErrors.businessName = 'Business name is required';
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

  // Reusable Input Field Component
  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    error, 
    icon: Icon,
    hint 
  }: any) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          className={`w-full bg-white border rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 transition-all duration-200 outline-none ${
            error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10' 
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 hover:border-slate-300'
          }`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="text-rose-500 text-xs mt-1.5 ml-1 font-medium animate-pulse">{error}</p>
      )}
      {hint && !error && (
        <p className="text-slate-400 text-xs mt-1.5 ml-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {hint}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 animate-fade-in">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-600">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Tax Information</h3>
          <p className="text-sm text-slate-500 leading-relaxed mt-1">
            Adding your GST details allows you to claim input tax credit on this purchase.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="GST Identification Number (GSTIN)"
          value={formData.gstNumber}
          onChange={(e: any) => handleChange('gstNumber', e.target.value.toUpperCase())}
          placeholder="07AABCU9603R1ZM"
          error={errors.gstNumber}
          icon={FileText}
          hint="Format: 15 alphanumeric characters"
        />
        
        <InputField
          label="Registered Business Name"
          value={formData.businessName}
          onChange={(e: any) => handleChange('businessName', e.target.value)}
          placeholder="Acme Corp Pvt Ltd"
          error={errors.businessName}
          icon={Building2}
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-white hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-black hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
          >
            Save Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default GSTInfoForm;