import React, { useState } from 'react';
import { CheckoutAddress } from '../../redux/types/checkout';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Home, Briefcase, Mail, Phone, X, Check, Navigation, Building, Hash } from 'lucide-react';

interface AddressFormProps {
  onSave: (address: any, setAsDefault?: boolean) => void;
  onCancel: () => void;
  initialData?: Partial<CheckoutAddress>;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'home',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    landmark: initialData?.landmark || '',
    country: initialData?.country || 'India'
  });
  
  const [setAsDefault, setSetAsDefault] = useState(initialData?.isDefault || false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid Indian phone number';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Invalid pincode (6 digits required)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onSave(formData, setAsDefault);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addressTypeOptions = [
    { value: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { value: 'work', label: 'Work', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'other', label: 'Other', icon: <Building className="w-4 h-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-b from-white to-slate-50/50 rounded-2xl border border-slate-200/70 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {initialData ? 'Edit Address' : 'Add New Address'}
              </h3>
              <p className="text-slate-300 text-sm">Enter your delivery details</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Address Type */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Address Type
          </label>
          <div className="flex gap-2">
            {addressTypeOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChange('type', option.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all duration-300 ${
                  formData.type === option.value
                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-300 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <span>First Name</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.firstName 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter first name"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <span className="text-sm font-medium">👤</span>
                </div>
              </div>
              <AnimatePresence>
                {errors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.firstName}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-400 transition-all duration-300"
                  placeholder="Enter last name"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <span className="text-sm">👤</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.phone 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="10-digit phone number"
                  maxLength={10}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  IN +91
                </div>
              </div>
              <AnimatePresence>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.phone}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.email 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="email@example.com"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Navigation className="w-4 h-4" />
                <span>Address Line 1</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.addressLine1 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="House/Flat No., Building, Street"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Navigation className="w-4 h-4" />
                </div>
              </div>
              <AnimatePresence>
                {errors.addressLine1 && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.addressLine1}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-400 transition-all duration-300"
                placeholder="Area, Locality, Landmark"
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <span>City</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.city 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter city"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <span className="text-sm">🏙️</span>
                </div>
              </div>
              <AnimatePresence>
                {errors.city && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.city}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <span>State</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.state 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="Enter state"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <span className="text-sm">🗺️</span>
                </div>
              </div>
              <AnimatePresence>
                {errors.state && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.state}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Hash className="w-4 h-4" />
                <span>Pincode</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 ${
                    errors.pincode 
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
              </div>
              <AnimatePresence>
                {errors.pincode && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>⚠</span> {errors.pincode}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Country and Default Address */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 pl-11 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-400 transition-all duration-300"
                  readOnly
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <span className="text-sm">🇮🇳</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <input
                  type="checkbox"
                  id="setAsDefault"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="setAsDefault"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                    setAsDefault
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
                      : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                    setAsDefault
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-400'
                  }`}>
                    {setAsDefault && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Set as default</span>
                    <p className="text-xs text-slate-500">Use for future orders</p>
                  </div>
                </label>
              </motion.div>
            </div>
          </div>

          {/* Form Actions */}
          <motion.div 
            className="flex justify-end gap-3 pt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3.5 bg-gradient-to-b from-white to-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl hover:border-slate-400 hover:shadow-sm transition-all duration-300"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-blue-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Address</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default AddressForm;