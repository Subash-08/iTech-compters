import React, { useState } from 'react';
import { pcBuilderService } from './services/pcBuilderService';

interface PCRequirementsFormData {
  fullName: string;
  phoneNumber: string;
  city: string;
  email: string;
  purpose: string;
  customPurpose?: string;
  budget: string;
  customBudget?: string;
  paymentPreference: string;
  deliveryTimeline: string;
  customTimeline?: string;
  additionalNotes?: string;
}

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

  const [errors, setErrors] = useState<Partial<PCRequirementsFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const purposeOptions = [
    'Gaming',
    'Office / Work from Home',
    'Professional Work (Editing, Designing, Architecture, etc.)',
    'Educational / Student Use',
    'General Home Use',
    'Other'
  ];

  const budgetOptions = [
    'Rs 25,000 - Rs 30,000',
    'Rs 30,000 - Rs 50,000',
    'Rs 50,000 - Rs 75,000',
    'Rs 75,000 - Rs 1,00,000',
    'Rs 1 Lakh - Rs 1.5 Lakh',
    'More than 1.5 Lakh',
    'Other'
  ];

  const paymentOptions = ['Full payment', 'Emi'];
  
  const timelineOptions = [
    'Immediately (Within 1–2 Days)',
    'Within a Week',
    'Within a Month',
    'Just Checking Prices',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<PCRequirementsFormData> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    
    if (!formData.city.trim()) newErrors.city = 'City/Location is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (!formData.budget) newErrors.budget = 'Budget is required';
    if (!formData.paymentPreference) newErrors.paymentPreference = 'Payment preference is required';
    if (!formData.deliveryTimeline) newErrors.deliveryTimeline = 'Delivery timeline is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof PCRequirementsFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the requirements data structure
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

      // Call the new API endpoint
      const response = await pcBuilderService.createPCRequirements(requirementsData);
      
      if (response.success) {
        setSubmitSuccess(true);
        if (onSuccess) onSuccess();
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
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
          setSubmitSuccess(false);
          if (onClose) onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting requirements:', error);
      alert('Failed to submit requirements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements Submitted Successfully!</h3>
        <p className="text-gray-600 mb-4">Our team will contact you within 24 hours with custom PC recommendations.</p>
        <p className="text-sm text-gray-500">You'll also receive a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us Your PC Requirements</h2>
        <p className="text-gray-600">Not sure about components? Fill this form and our experts will suggest the perfect PC for your needs.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="9876543210"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City / Location *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Mumbai"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* PC Requirements */}
        <div className="space-y-6">
          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What purpose is this PC going to serve you? *
            </label>
            <div className="space-y-2">
              {purposeOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`purpose-${option}`}
                    name="purpose"
                    value={option}
                    checked={formData.purpose === option}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`purpose-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {formData.purpose === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  name="customPurpose"
                  value={formData.customPurpose}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please specify your purpose"
                />
              </div>
            )}
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              The Investment that you're planning for this PC *
            </label>
            <div className="space-y-2">
              {budgetOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`budget-${option}`}
                    name="budget"
                    value={option}
                    checked={formData.budget === option}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`budget-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {formData.budget === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  name="customBudget"
                  value={formData.customBudget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please specify your budget"
                />
              </div>
            )}
            {errors.budget && (
              <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
            )}
          </div>

          {/* Payment Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you prefer to make your payment? *
            </label>
            <div className="flex space-x-6">
              {paymentOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`payment-${option}`}
                    name="paymentPreference"
                    value={option}
                    checked={formData.paymentPreference === option}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`payment-${option}`} className="ml-2 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {errors.paymentPreference && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentPreference}</p>
            )}
          </div>

          {/* Delivery Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How soon do you need the product? *
            </label>
            <div className="space-y-2">
              {timelineOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`timeline-${option}`}
                    name="deliveryTimeline"
                    value={option}
                    checked={formData.deliveryTimeline === option}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`timeline-${option}`} className="ml-3 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {formData.deliveryTimeline === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  name="customTimeline"
                  value={formData.customTimeline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please specify your timeline"
                />
              </div>
            )}
            {errors.deliveryTimeline && (
              <p className="mt-1 text-sm text-red-600">{errors.deliveryTimeline}</p>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any specific requirements, software needs, or preferences..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Requirements'}
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p>By submitting this form, you agree to our Terms of Service and Privacy Policy. Our team will contact you within 24 hours.</p>
        </div>
      </form>
    </div>
  );
};

export default PCRequirementsForm;