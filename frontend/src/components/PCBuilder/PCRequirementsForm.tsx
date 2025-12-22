import React, { useState, useCallback } from 'react';
import { pcBuilderService } from './services/pcBuilderService';

// --- Types ---
type PaymentPreference = 'Full payment' | 'Emi';

interface PCRequirementsFormData {
  fullName: string;
  phoneNumber: string;
  city: string;
  email: string;
  purpose: string;
  customPurpose?: string;
  budget: string;
  customBudget?: string;
  paymentPreference: PaymentPreference | '';
  deliveryTimeline: string;
  customTimeline?: string;
  additionalNotes?: string;
}

// --- Constants ---
const PURPOSE_OPTIONS = [
  'Gaming',
  'Office / Work from Home',
  'Professional Work (Editing, Designing, Architecture, etc.)',
  'Educational / Student Use',
  'General Home Use',
  'Other'
];

const BUDGET_OPTIONS = [
  'Rs 25,000 - Rs 30,000',
  'Rs 30,000 - Rs 50,000',
  'Rs 50,000 - Rs 75,000',
  'Rs 75,000 - Rs 1,00,000',
  'Rs 1 Lakh - Rs 1.5 Lakh',
  'More than 1.5 Lakh',
  'Other'
];

const PAYMENT_OPTIONS: PaymentPreference[] = ['Full payment', 'Emi'];

const TIMELINE_OPTIONS = [
  'Immediately (Within 1–2 Days)',
  'Within a Week',
  'Within a Month',
  'Just Checking Prices',
  'Other'
];

// --- Helper Component for Radio Groups ---
interface RadioGroupProps {
  label: string;
  name: string;
  options: string[];
  selectedValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showCustomInput?: boolean;
  customInputValue?: string;
  onCustomInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customInputPlaceholder?: string;
  customInputName?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
  error,
  showCustomInput,
  customInputValue,
  onCustomInputChange,
  customInputPlaceholder,
  customInputName
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option} className="flex items-center">
          <input
            type="radio"
            id={`${name}-${option}`}
            name={name}
            value={option}
            checked={selectedValue === option}
            onChange={onChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
          />
          <label htmlFor={`${name}-${option}`} className="ml-3 text-sm text-gray-700 cursor-pointer">
            {option}
          </label>
        </div>
      ))}
    </div>
    {showCustomInput && onCustomInputChange && (
      <div className="mt-3 animate-fadeIn">
        <input
          type="text"
          name={customInputName}
          value={customInputValue}
          onChange={onCustomInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder={customInputPlaceholder}
        />
      </div>
    )}
    {error && <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>}
  </div>
);

// --- Main Component ---
const PCRequirementsForm: React.FC<{ onClose?: () => void; onSuccess?: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<PCRequirementsFormData>({
    fullName: '',
    phoneNumber: '',
    city: '',
    email: '',
    purpose: '',
    customPurpose: '',
    budget: '',
    customBudget: '',
    paymentPreference: '',
    deliveryTimeline: '',
    customTimeline: '',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PCRequirementsFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof PCRequirementsFormData, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Enter a valid 10-digit number';
    
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.purpose === 'Other' && !formData.customPurpose?.trim()) newErrors.purpose = 'Please specify your purpose';

    if (!formData.budget) newErrors.budget = 'Budget is required';
    if (formData.budget === 'Other' && !formData.customBudget?.trim()) newErrors.budget = 'Please specify your budget';

    if (!formData.paymentPreference) newErrors.paymentPreference = 'Payment preference is required';
    
    if (!formData.deliveryTimeline) newErrors.deliveryTimeline = 'Timeline is required';
    if (formData.deliveryTimeline === 'Other' && !formData.customTimeline?.trim()) newErrors.deliveryTimeline = 'Please specify your timeline';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for specific field immediately
    setErrors(prev => {
        if (!prev[name as keyof PCRequirementsFormData]) return prev;
        const newErrs = { ...prev };
        delete newErrs[name as keyof PCRequirementsFormData];
        return newErrs;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const requirementsData = {
        customer: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phoneNumber,
          city: formData.city,
          additionalNotes: formData.additionalNotes || ''
        },
        requirements: {
          purpose: formData.purpose === 'Other' ? formData.customPurpose || '' : formData.purpose,
          budget: formData.budget === 'Other' ? formData.customBudget || '' : formData.budget,
          paymentPreference: formData.paymentPreference,
          deliveryTimeline: formData.deliveryTimeline === 'Other' ? formData.customTimeline || '' : formData.deliveryTimeline
        },
        source: 'requirements_form',
        metadata: {
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString()
        }
      };

      const response = await pcBuilderService.createPCRequirements(requirementsData);
      
      if (response.success) {
        setSubmitSuccess(true);
        if (onSuccess) onSuccess();
        
        setTimeout(() => {
          setSubmitSuccess(false);
          if (onClose) onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting requirements:', error);
      // Ideally show a toast notification here
      alert('Failed to submit requirements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center animate-fadeIn">
        <div className="text-green-600 mb-4 inline-flex p-3 bg-green-100 rounded-full">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
        <p className="text-gray-600 mb-1">Our experts are analyzing your requirements.</p>
        <p className="text-sm text-gray-500">Expect a call or email within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 max-w-3xl mx-auto border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Custom PC Requirements</h2>
        <p className="text-gray-500 mt-1 text-sm">Tell us what you need, and we'll engineer the perfect build for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Contact Details */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">1</span>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                placeholder="Ex: Rajesh Kumar"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${errors.phoneNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                placeholder="Ex: 9876543210"
                maxLength={10}
              />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                placeholder="Ex: rajesh@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / Location *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${errors.city ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                placeholder="Ex: Bangalore"
              />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Build Requirements */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">2</span>
            Build Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RadioGroup
              label="Primary Purpose *"
              name="purpose"
              options={PURPOSE_OPTIONS}
              selectedValue={formData.purpose}
              onChange={handleInputChange}
              error={errors.purpose}
              showCustomInput={formData.purpose === 'Other'}
              customInputValue={formData.customPurpose}
              onCustomInputChange={handleInputChange}
              customInputName="customPurpose"
              customInputPlaceholder="Specify your primary usage..."
            />

            <RadioGroup
              label="Planned Budget *"
              name="budget"
              options={BUDGET_OPTIONS}
              selectedValue={formData.budget}
              onChange={handleInputChange}
              error={errors.budget}
              showCustomInput={formData.budget === 'Other'}
              customInputValue={formData.customBudget}
              onCustomInputChange={handleInputChange}
              customInputName="customBudget"
              customInputPlaceholder="Enter your specific budget..."
            />
          </div>
        </section>

        {/* Section 3: Logistics */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">3</span>
            Logistics & Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
             <RadioGroup
              label="Payment Preference *"
              name="paymentPreference"
              options={PAYMENT_OPTIONS}
              selectedValue={formData.paymentPreference}
              onChange={handleInputChange}
              error={errors.paymentPreference}
            />

            <RadioGroup
              label="Delivery Timeline *"
              name="deliveryTimeline"
              options={TIMELINE_OPTIONS}
              selectedValue={formData.deliveryTimeline}
              onChange={handleInputChange}
              error={errors.deliveryTimeline}
              showCustomInput={formData.deliveryTimeline === 'Other'}
              customInputValue={formData.customTimeline}
              onCustomInputChange={handleInputChange}
              customInputName="customTimeline"
              customInputPlaceholder="Specify when you need it..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
              placeholder="E.g., Specific cabinet color, liquid cooling preference, software requirements..."
            />
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all shadow-sm flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PCRequirementsForm;