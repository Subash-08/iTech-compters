import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { AlertItem } from '../types/dashboard';
import { Icons } from '../Icon';
import { Package, TrendingDown, MessageSquare } from 'lucide-react';

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {

  const severityStyles = {
    critical: {
      bg: "bg-red-50/70",
      border: "border-red-200",
      text: "text-red-700",
      iconBg: "bg-red-100"
    },
    high: {
      bg: "bg-orange-50/70",
      border: "border-orange-200",
      text: "text-orange-700",
      iconBg: "bg-orange-100"
    },
    medium: {
      bg: "bg-yellow-50/70",
      border: "border-yellow-200",
      text: "text-yellow-700",
      iconBg: "bg-yellow-100"
    },
    low: {
      bg: "bg-blue-50/70",
      border: "border-blue-200",
      text: "text-blue-700",
      iconBg: "bg-blue-100"
    }
  };

  const typeIcons = {
    order: <Package className="w-4 h-4" />,
    payment: <Icons.CreditCard className="w-4 h-4" />,
    stock: <TrendingDown className="w-4 h-4" />,
    invoice: <Icons.FileText className="w-4 h-4" />,
    quote: <MessageSquare className="w-4 h-4" />,
    user: <Icons.User className="w-4 h-4" />,
    default: <Icons.Bell className="w-4 h-4" />
  };

  const severityIcons = {
    critical: <Icons.AlertTriangle className="w-4 h-4 text-red-700" />,
    high: <Icons.AlertCircle className="w-4 h-4 text-orange-700" />,
    medium: <Icons.Info className="w-4 h-4 text-yellow-700" />,
    low: <Icons.Bell className="w-4 h-4 text-blue-700" />,
    default: <Icons.Bell className="w-4 h-4 text-gray-600" />
  };

  return (
    <motion.div
      className="bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-lg flex flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/40 backdrop-blur-xl py-2 z-10 border-b border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icons.Bell className="w-5 h-5 text-gray-600" />
          Alerts & Notifications
        </h3>
        <span className="text-sm text-gray-500">{alerts.length} alerts</span>
      </div>

      {/* Alert List */}
      <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              className="text-center py-12 text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Icons.CheckCircle className="w-14 h-14 mx-auto mb-3 text-green-500 opacity-60" />
              <p className="text-base font-medium">No active alerts</p>
              <p className="text-sm opacity-70">Everything looks good</p>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const style = severityStyles[alert.severity] || severityStyles.low;

              return (
                <motion.div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${style.bg} ${style.border} hover:shadow-lg transition-shadow cursor-pointer`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-start gap-3">

                    {/* Severity Icon */}
                    <div className={`p-2 rounded-xl ${style.iconBg}`}>
                      {severityIcons[alert.severity] || severityIcons.default}
                    </div>

                    {/* Content */}
                    <div className="flex-1">

                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {alert.title}
                        </h4>

                        <div className="flex items-center gap-2">
                          <div className="text-gray-600">
                            {typeIcons[alert.type] || typeIcons.default}
                          </div>

                          {alert.actionRequired && (
                            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full shadow-sm">
                              Action Required
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-1">{alert.description}</p>

                      <div className="flex justify-between text-xs mt-3 text-gray-500">
                        <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="pt-4 border-t border-gray-200/50 mt-4">
          <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
            View All Alerts
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AlertsPanel;
