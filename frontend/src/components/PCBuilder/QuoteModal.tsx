import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  User, 
  FileText, 
  CheckCircle, 
  ArrowLeft,
  X,
  Package // Added missing import used in icon list
} from 'lucide-react';
import { SelectedComponents, CustomerDetails } from './types/pcBuilder';
import { pcBuilderService } from './services/pcBuilderService';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  selectedComponents: SelectedComponents;
  totalPrice?: number; // Kept optional to not break parent, but unused
}

const QuoteModal: React.FC<QuoteModalProps> = ({ 
  open, 
  onClose, 
  selectedComponents 
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
        productPrice: 0, // Price removed from submission logic as well
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🚀 Get Your PC Quote</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Stepper */}
          <div className="flex justify-between items-center relative px-2">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 ${
                  index <= activeStep
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {index < activeStep ? <CheckCircle size={16} /> : index + 1}
                </div>
                <span className={`text-xs mt-2 text-center font-medium ${
                  index <= activeStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
            ))}
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0 mx-10">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          {activeStep === 0 && (
            <div className="animate-fade-in">
              <div className="bg-white border border-blue-100 rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Build Overview</h3>
                    <p className="text-sm text-gray-500">
                      You have selected {selectedProducts.length} components
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Selected Components</h4>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                  {selectedProducts.map(({ categorySlug, product }) => (
                    <div key={categorySlug} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                            {categorySlug.replace(/-/g, ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedProducts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No components selected yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                <p className="text-gray-500 text-sm mt-1">
                  We'll send the quote to these details.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={customerDetails.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d+]/g, '');
                        handleInputChange('phone', val);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Additional Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                    <textarea
                      value={customerDetails.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none"
                      placeholder="Any specific requirements..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="text-center py-10 animate-fade-in">
              {success ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Quote Request Received!
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    We've received your configuration. Our team will review it and send you a detailed quote shortly.
                  </p>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-200 inline-block text-left min-w-[280px] shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Reference ID</div>
                    <div className="font-mono text-lg font-bold text-gray-900 break-all">
                      {quoteId || 'PENDING'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Submitting your request...
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
          {activeStep < 2 && (
            <div className="flex justify-between items-center">
              <button
                onClick={activeStep === 0 ? handleClose : handleBack}
                disabled={loading}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {activeStep === 0 ? 'Cancel' : (
                  <span className="flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </span>
                )}
              </button>
              
              <button
                onClick={handleNext}
                disabled={!isStepValid() || loading || (activeStep === 0 && selectedProducts.length === 0)}
                className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all transform active:scale-95 ${
                  !isStepValid() || loading || (activeStep === 0 && selectedProducts.length === 0)
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  activeStep === 1 ? 'Submit Request' : 'Continue'
                )}
              </button>
            </div>
          )}
          
          {activeStep === 2 && (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md transition-all active:scale-95"
            >
              Back to Builder
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;