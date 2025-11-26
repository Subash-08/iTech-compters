import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { Icons } from '../Icon';
import { Cpu, TrendingUp } from 'lucide-react';

const PCAnalytics: React.FC = () => {
  const [pcData, setPcData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPcData = async () => {
      try {
        const response = await dashboardService.getPCAnalytics();
        setPcData(response.data);
      } catch (error) {
        console.error('Error fetching PC analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPcData();
  }, []);

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

  return (
    <div className="bg-white/50 backdrop-blur-lg rounded-2xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">PC Builder Analytics</h3>
        <Cpu className="w-5 h-5 text-gray-600" />
      </div>

      {/* PC Builder Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/30">
          <div className="text-2xl font-bold text-blue-700">{pcData?.totalQuotes || 0}</div>
          <div className="text-sm text-blue-600">Total Quotes</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/30">
          <div className="text-2xl font-bold text-green-700">{pcData?.approvedQuotes || 0}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/30">
          <div className="text-2xl font-bold text-orange-700">{pcData?.pendingQuotes || 0}</div>
          <div className="text-sm text-orange-600">Pending</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-4 border border-red-200/30">
          <div className="text-2xl font-bold text-red-700">{pcData?.expiredQuotes || 0}</div>
          <div className="text-sm text-red-600">Expired</div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-purple-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-purple-700">{pcData?.conversionRate || 0}%</div>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      {/* Popular Components */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Popular Components</h4>
        {pcData?.topComponents?.slice(0, 3).map((component: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-200/30">
            <div>
              <div className="font-medium text-sm text-gray-900 capitalize">{component.category}</div>
              <div className="text-xs text-gray-500">{component.component}</div>
            </div>
            <div className="text-sm font-semibold text-blue-700">{component.count} uses</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PCAnalytics;