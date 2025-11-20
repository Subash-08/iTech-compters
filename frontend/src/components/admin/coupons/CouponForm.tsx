import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Coupon, CouponFormData } from '../types/coupon';
import { couponService } from '../services/couponService';
import { Icons } from '../Icon';

const CouponForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maximumDiscount: undefined,
    minimumCartValue: 0,
    usageLimit: undefined,
    usageLimitPerUser: 1,
    validFrom: '',
    validUntil: '',
    applicableTo: 'all_products',
    specificProducts: [],
    specificCategories: [],
    specificBrands: [],
    excludedProducts: [],
    userEligibility: 'all_users',
    allowedUsers: [],
    minimumOrders: 0,
    isOneTimeUse: false,
    status: 'active'
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchCoupon();
    }
  }, [isEdit, id]);

  const fetchCoupon = async () => {
    try {
      setLoading(true);
      const response = await couponService.getCoupon(id!);
      const coupon = response.coupon;
      
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maximumDiscount: coupon.maximumDiscount || undefined,
        minimumCartValue: coupon.minimumCartValue,
        usageLimit: coupon.usageLimit || undefined,
        usageLimitPerUser: coupon.usageLimitPerUser,
        validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
        validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
        applicableTo: coupon.applicableTo,
        specificProducts: coupon.specificProducts || [],
        specificCategories: coupon.specificCategories || [],
        specificBrands: coupon.specificBrands || [],
        excludedProducts: coupon.excludedProducts || [],
        userEligibility: coupon.userEligibility,
        allowedUsers: coupon.allowedUsers || [],
        minimumOrders: coupon.minimumOrders,
        isOneTimeUse: coupon.isOneTimeUse,
        status: coupon.status
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? (value === '' ? '' : parseFloat(value)) : 
               value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate dates
      const validFrom = new Date(formData.validFrom);
      const validUntil = new Date(formData.validUntil);
      
      if (validFrom >= validUntil) {
        setError('Valid until date must be after valid from date');
        setLoading(false);
        return;
      }

      if (isEdit) {
        await couponService.updateCoupon(id!, formData);
        setSuccess('Coupon updated successfully');
      } else {
        await couponService.createCoupon(formData);
        setSuccess('Coupon created successfully');
      }

      setTimeout(() => {
        navigate('/admin/coupons');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} coupon`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/coupons');
  };

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icons.Clock className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading coupon...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update coupon details and settings' : 'Create a new discount coupon for your store'}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.ArrowLeft className="w-5 h-5" />
          <span>Back to Coupons</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="SUMMER25"
            />
            <p className="text-xs text-gray-500 mt-1">Uppercase letters and numbers only</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Summer Sale 25% Off"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the purpose of this coupon..."
          />
        </div>

        {/* Discount Configuration */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Discount Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            {formData.discountType !== 'free_shipping' && (
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  id="discountValue"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder={formData.discountType === 'percentage' ? '25' : '100'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discountType === 'percentage' ? 'Percentage (0-100)' : 'Fixed amount'}
                </p>
              </div>
            )}

            {formData.discountType === 'percentage' && (
              <div>
                <label htmlFor="maximumDiscount" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount
                </label>
                <input
                  type="number"
                  id="maximumDiscount"
                  name="maximumDiscount"
                  value={formData.maximumDiscount || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="No limit"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum discount amount (optional)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label htmlFor="minimumCartValue" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Cart Value
              </label>
              <input
                type="number"
                id="minimumCartValue"
                name="minimumCartValue"
                value={formData.minimumCartValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum order amount to use coupon</p>
            </div>

            <div>
              <label htmlFor="minimumOrders" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Orders Required
              </label>
              <input
                type="number"
                id="minimumOrders"
                name="minimumOrders"
                value={formData.minimumOrders}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum number of previous orders</p>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Total Usage Limit
              </label>
              <input
                type="number"
                id="usageLimit"
                name="usageLimit"
                value={formData.usageLimit || ''}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="No limit"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum total uses (optional)</p>
            </div>

            <div>
              <label htmlFor="usageLimitPerUser" className="block text-sm font-medium text-gray-700 mb-1">
                Uses Per User *
              </label>
              <input
                type="number"
                id="usageLimitPerUser"
                name="usageLimitPerUser"
                value={formData.usageLimitPerUser}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isOneTimeUse"
                  checked={formData.isOneTimeUse}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">One-time use only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Validity Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">
                Valid From *
              </label>
              <input
                type="date"
                id="validFrom"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                id="validUntil"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Applicability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="applicableTo" className="block text-sm font-medium text-gray-700 mb-1">
                Applicable To
              </label>
              <select
                id="applicableTo"
                name="applicableTo"
                value={formData.applicableTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all_products">All Products</option>
                <option value="specific_products">Specific Products</option>
                <option value="specific_categories">Specific Categories</option>
                <option value="specific_brands">Specific Brands</option>
              </select>
            </div>

            <div>
              <label htmlFor="userEligibility" className="block text-sm font-medium text-gray-700 mb-1">
                User Eligibility
              </label>
              <select
                id="userEligibility"
                name="userEligibility"
                value={formData.userEligibility}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all_users">All Users</option>
                <option value="new_users">New Users Only</option>
                <option value="existing_users">Existing Users Only</option>
                <option value="specific_users">Specific Users Only</option>
              </select>
            </div>
          </div>

          {/* Note about specific selections */}
          {(formData.applicableTo !== 'all_products' || formData.userEligibility === 'specific_users') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <Icons.Info className="w-4 h-4 inline mr-1" />
                {formData.applicableTo !== 'all_products' && formData.userEligibility === 'specific_users' 
                  ? 'Specific products/categories/brands and users can be selected after saving the coupon.'
                  : formData.applicableTo !== 'all_products'
                  ? 'Specific products/categories/brands can be selected after saving the coupon.'
                  : 'Specific users can be selected after saving the coupon.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === 'active'}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === 'inactive'}
                onChange={handleInputChange}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Inactive</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t pt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <Icons.Spinner className="w-4 h-4 animate-spin" />}
            <span>{isEdit ? 'Update Coupon' : 'Create Coupon'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponForm;