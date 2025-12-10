import React from 'react';
import { Cpu, TrendingUp } from 'lucide-react';

interface PCAnalyticsProps {
  data?: any;
  loading?: boolean;
}

const PCAnalytics: React.FC<PCAnalyticsProps> = ({ data, loading = false }) => {
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
  const totalQuotes = data?.totalQuotes || 0;
  const approvedQuotes = data?.approvedQuotes || 0;
  const pendingQuotes = data?.pendingQuotes || 0;
  const expiredQuotes = data?.expiredQuotes || 0;
  const conversionRate = data?.conversionRate || 0;
  const topComponents = data?.topComponents || [];

  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">PC Builder Analytics</h3>
        <Cpu className="w-5 h-5 text-gray-600" />
      </div>

      {/* PC Builder Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/30">
          <div className="text-2xl font-bold text-blue-700">{totalQuotes}</div>
          <div className="text-sm text-blue-600">Total Quotes</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/30">
          <div className="text-2xl font-bold text-green-700">{approvedQuotes}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/30">
          <div className="text-2xl font-bold text-orange-700">{pendingQuotes}</div>
          <div className="text-sm text-orange-600">Pending</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-4 border border-red-200/30">
          <div className="text-2xl font-bold text-red-700">{expiredQuotes}</div>
          <div className="text-sm text-red-600">Expired</div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-purple-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-purple-700">
              {conversionRate.toFixed(1)}%
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Popular Components */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Popular Components</h4>
        {topComponents.length > 0 ? (
          topComponents.slice(0, 3).map((component: any, index: number) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200/30 hover:bg-white/70 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {component.component || 'Unknown Component'}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {component.category || 'Uncategorized'}
                </div>
              </div>
              <div className="text-sm font-semibold text-blue-700 whitespace-nowrap ml-2">
                {component.count || 0} uses
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 bg-gray-50/50 rounded-lg border border-gray-200/30">
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No PC builder data available</p>
          </div>
        )}
      </div>

      {/* Weekly Quotes if available */}
      {data?.weeklyQuotes?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Weekly Quotes Trend</h4>
          <div className="space-y-2">
            {data.weeklyQuotes.slice(0, 3).map((week: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{week.week || 'Week'}</span>
                <span className="font-medium text-gray-900">
                  {week.quotes || 0} quotes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PCAnalytics;