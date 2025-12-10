import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  User, 
  FileText, 
  CheckCircle, 
  ArrowLeft,
  X,
  Package,
  IndianRupee
} from 'lucide-react';
import { SelectedComponents, CustomerDetails } from './types/pcBuilder';
import { pcBuilderService } from './services/pcBuilderService';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  selectedComponents: SelectedComponents;
  totalPrice: number;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ 
  open, 
  onClose, 
  selectedComponents, 
  totalPrice 
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [quoteId, setQuoteId] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const steps = ['Review Build', 'Contact Details', 'Confirmation'];

  const selectedProducts = Object.entries(selectedComponents)
    .filter(([_, product]) => product)
    .map(([categorySlug, product]) => ({ categorySlug, product: product! }));

  const handleInputChange = (field: keyof CustomerDetails, value: string): void => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = (): void => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      submitQuote();
    }
  };

  const handleBack = (): void => {
    setActiveStep(prev => prev - 1);
  };

  const submitQuote = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const components = Object.entries(selectedComponents).map(([categorySlug, product]) => ({
        category: categorySlug,
        categorySlug,
        productId: product?._id || null,
        productName: product?.name || '',
        productPrice: product?.price || 0,
        userNote: '',
        selected: !!product,
        required: false,
        sortOrder: 0
      }));

      const response = await pcBuilderService.createPCQuote({
        customer: customerDetails,
        components
      });

      setQuoteId(response.quoteId);
      setSuccess(true);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    onClose();
    setTimeout(() => {
      setActiveStep(0);
      setCustomerDetails({ name: '', email: '', phone: '', notes: '' });
      setError('');
      setSuccess(false);
      setQuoteId('');
    }, 300);
  };

  const isStepValid = (): boolean => {
    if (activeStep === 1) {
      return customerDetails.name.trim() !== '' && 
             customerDetails.email.trim() !== '' && 
             /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(customerDetails.email);
    }
    return true;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🚀 Get Your PC Quote</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Stepper */}
          <div className="flex justify-between items-center relative">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  index <= activeStep
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < activeStep ? <CheckCircle size={16} /> : index + 1}
                </div>
                <span className={`text-xs mt-2 text-center ${
                  index <= activeStep ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
            ))}
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {activeStep === 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Build Summary</h3>
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Estimated Cost:</span>
                  <span className="text-2xl font-bold text-blue-600 flex items-center">
                    <IndianRupee size={20} className="mr-1" />
                    {totalPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProducts.length} components selected
                </p>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-3">Selected Components:</h4>
              <div className="max-h-60 overflow-y-auto space-y-3">
                {selectedProducts.map(({ categorySlug, product }) => (
                  <div key={categorySlug} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {categorySlug.replace(/-/g, ' ')}
                      </div>
                    </div>
                    <div className="font-bold text-blue-600 flex items-center">
                      <IndianRupee size={16} />
                      {product.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Contact Information</h3>
              <p className="text-gray-600 mb-4">
                We'll use this information to send your custom quote and discuss your build requirements.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={customerDetails.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Phone Number
  </label>
  <div className="relative">
    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="tel"
      value={customerDetails.phone}
      onChange={(e) => {
        // Remove all non-digit characters except plus
        let value = e.target.value.replace(/[^\d+]/g, '');
        
        // Ensure it starts with + if international
        if (value && !value.startsWith('+')) {
          // For Indian numbers, add +91 prefix
          if (/^[6-9]\d{9}$/.test(value)) {
            value = '+91' + value;
          }
          // Allow starting with country code without + for now
        }
        
        handleInputChange('phone', value);
      }}
      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="+91XXXXXXXXXX"
      pattern="^\+[1-9]\d{0,15}$"
      title="Enter international phone number starting with + (e.g., +919876543210)"
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">
    Enter with country code (e.g., +91 for India)
  </p>
</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                      value={customerDetails.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Any special requirements, budget constraints, or timeline preferences..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="text-center py-8">
              {success ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Quote Request Submitted!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your custom PC quote request has been received successfully.
                  </p>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="font-bold text-green-800 mb-2">
                      Quote ID: {quoteId}
                    </div>
                    <div className="text-green-700">
                      We'll contact you within 24 hours with your custom quote.
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Submitting your quote request...
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          {activeStep < 2 && (
            <div className="flex justify-between items-center">
              <button
                onClick={activeStep === 0 ? handleClose : handleBack}
                disabled={loading}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
              >
                {activeStep === 0 ? 'Cancel' : (
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Back
                  </div>
                )}
              </button>
              
              <button
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                  !isStepValid() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  activeStep === 1 ? 'Submit Quote' : 'Continue'
                )}
              </button>
            </div>
          )}
          
          {activeStep === 2 && (
            <button
              onClick={handleClose}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;