import React from 'react';
import { Crown, Ticket, DollarSign } from 'lucide-react';

interface CouponAnalyticsProps {
  data?: any;
  loading?: boolean;
}

const CouponAnalytics: React.FC<CouponAnalyticsProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Safe data access with fallbacks
  const totalCoupons = data?.totalCoupons || 0;
  const activeCoupons = data?.activeCoupons || 0;
  const totalUsage = data?.totalUsage || 0;
  const discountGiven = data?.discountGiven || 0;
  const mostUsed = data?.mostUsed || null;

  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Coupon Analytics</h3>
        <Ticket className="w-5 h-5 text-gray-600" />
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/30">
          <div className="text-2xl font-bold text-blue-700">{totalCoupons}</div>
          <div className="text-sm text-blue-600">Total Coupons</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/30">
          <div className="text-2xl font-bold text-green-700">{activeCoupons}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/30">
          <div className="text-2xl font-bold text-orange-700">{totalUsage}</div>
          <div className="text-sm text-orange-600">Total Usage</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 border border-purple-200/30">
          <div className="text-2xl font-bold text-purple-700">
            {data?.newCouponsThisMonth || 0}
          </div>
          <div className="text-sm text-purple-600">New This Month</div>
        </div>
      </div>

      {/* Most Used Coupon */}
      {mostUsed && (
        <div className="mb-4 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg border border-yellow-200/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-yellow-800">Most Used Coupon</span>
            <Crown className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-yellow-700">{mostUsed.code}</div>
              <div className="text-sm text-yellow-600">
                Used {mostUsed.usageCount || 0} times
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-yellow-700">
                ₹{mostUsed.discountAmount || 0} off
              </div>
              <div className="text-xs text-yellow-600">
                per use
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Given */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-green-600">Total Discount Given</div>
            <div className="text-xl font-bold text-green-700">
              ₹{(discountGiven || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
      </div>

      {/* Empty state for no coupon performance */}
      {data?.performance?.length === 0 && totalCoupons > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            No coupons have been used yet in the selected period
          </p>
        </div>
      )}
    </div>
  );
};

export default CouponAnalytics;