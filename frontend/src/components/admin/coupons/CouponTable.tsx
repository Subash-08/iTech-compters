// components/admin/coupons/CouponTable.tsx
import React from 'react';
import { Coupon } from '../types/coupon';
import { Icons } from '../Icon';

interface CouponTableProps {
  coupons: Coupon[];
  loading: boolean;
  onStatusToggle: (couponId: string, currentStatus: 'active' | 'inactive') => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getDiscountTypeBadge: (discountType: string) => React.ReactNode;
}

const CouponTable: React.FC<CouponTableProps> = ({
  coupons,
  loading,
  onStatusToggle,
  onEdit,
  onDelete,
  getStatusBadge,
  getDiscountTypeBadge
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case 'percentage':
        return `${coupon.discountValue}%${coupon.maximumDiscount ? ` (max ₹${coupon.maximumDiscount})` : ''}`;
      case 'fixed':
        return `₹${coupon.discountValue}`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icons.Clock className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading coupons...</span>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <Icons.Tag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No coupons</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new coupon.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code & Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usage
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Validity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {coupons.map((coupon) => (
            <tr key={coupon._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 font-mono">
                    {coupon.code}
                  </div>
                  <div className="text-sm text-gray-500">
                    {coupon.name}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatDiscount(coupon)}
                </div>
                <div className="text-sm text-gray-500">
                  {getDiscountTypeBadge(coupon.discountType)}
                </div>
                {coupon.minimumCartValue > 0 && (
                  <div className="text-xs text-gray-400">
                    Min: ₹{coupon.minimumCartValue}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {coupon.usageCount} / {coupon.usageLimit || '∞'}
                </div>
                <div className="text-xs text-gray-500">
                  {coupon.usageLimitPerUser} per user
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  Until {formatDate(coupon.validUntil)}
                </div>
                {coupon.daysRemaining !== undefined && (
                  <div className={`text-xs ${coupon.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                    {coupon.daysRemaining} days left
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(coupon.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(coupon)}
                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                    title="Edit coupon"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onStatusToggle(coupon._id, coupon.status as 'active' | 'inactive')}
                    className={`transition-colors duration-200 ${
                      coupon.status === 'active' 
                        ? 'text-orange-600 hover:text-orange-900' 
                        : 'text-green-600 hover:text-green-900'
                    }`}
                    title={coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {coupon.status === 'active' ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => onDelete(coupon._id)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    title="Delete coupon"
                    disabled={coupon.usageCount > 0}
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CouponTable;