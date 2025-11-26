import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingBag, Clock, XCircle, Users, ArrowUp, ArrowDown } from 'lucide-react';
import CountUp from 'react-countup';

interface StatCardProps {
  title: string;
  value: number | undefined | null;
  format: 'currency' | 'number' | 'percentage';
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  icon?: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  format, 
  change, 
  trend = 'neutral',
  color,
  icon,
  loading = false
}) => {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-200/50',
      text: 'text-blue-700',
      bg: 'bg-blue-500/10',
      trend: 'text-blue-600'
    },
    green: {
      gradient: 'from-green-500/20 to-green-600/20',
      border: 'border-green-200/50',
      text: 'text-green-700',
      bg: 'bg-green-500/10',
      trend: 'text-green-600'
    },
    purple: {
      gradient: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-200/50',
      text: 'text-purple-700',
      bg: 'bg-purple-500/10',
      trend: 'text-purple-600'
    },
    orange: {
      gradient: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-200/50',
      text: 'text-orange-700',
      bg: 'bg-orange-500/10',
      trend: 'text-orange-600'
    },
    red: {
      gradient: 'from-red-500/20 to-red-600/20',
      border: 'border-red-200/50',
      text: 'text-red-700',
      bg: 'bg-red-500/10',
      trend: 'text-red-600'
    },
    indigo: {
      gradient: 'from-indigo-500/20 to-indigo-600/20',
      border: 'border-indigo-200/50',
      text: 'text-indigo-700',
      bg: 'bg-indigo-500/10',
      trend: 'text-indigo-600'
    }
  };

  const defaultIcons = {
    blue: <TrendingUp className="w-5 h-5" />,
    green: <DollarSign className="w-5 h-5" />,
    purple: <ShoppingBag className="w-5 h-5" />,
    orange: <Clock className="w-5 h-5" />,
    red: <XCircle className="w-5 h-5" />,
    indigo: <Users className="w-5 h-5" />
  };

  const trendIcons = {
    up: <ArrowUp className="w-3 h-3" />,
    down: <ArrowDown className="w-3 h-3" />,
    neutral: null
  };

  const config = colorConfig[color];

  const formatValue = (val: number | undefined | null, fmt: string) => {
    if (val === undefined || val === null || isNaN(val)) {
      switch (fmt) {
        case 'currency':
          return '₹0';
        case 'percentage':
          return '0%';
        default:
          return '0';
      }
    }

    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const displayValue = value === undefined || value === null || isNaN(value) ? 0 : value;

  if (loading) {
    return (
      <div className={`relative p-6 rounded-2xl border ${config.border} bg-white/50 backdrop-blur-sm shadow-sm animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        y: -2
      }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-6 rounded-2xl border backdrop-blur-sm
        bg-gradient-to-br ${config.gradient} ${config.border}
        shadow-lg hover:shadow-xl transition-all duration-300
        group cursor-pointer
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-semibold ${config.text} mb-3 flex items-center gap-2`}>
              {title}
              {trend !== 'neutral' && (
                <span className={`flex items-center gap-1 text-xs ${config.trend}`}>
                  {trendIcons[trend]}
                </span>
              )}
            </p>
            
            <div className="flex items-baseline gap-2 mb-2">
              <p className={`text-3xl font-bold ${config.text}`}>
                {format === 'currency' && '₹'}
                <CountUp
                  end={displayValue}
                  duration={2.5}
                  separator=","
                  decimals={format === 'percentage' ? 1 : 0}
                />
                {format === 'percentage' && '%'}
              </p>
            </div>

            {change && (
              <p className={`text-xs font-medium ${config.text} opacity-80 flex items-center gap-1`}>
                {change}
              </p>
            )}
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`
              p-3 rounded-xl backdrop-blur-sm
              transition-all duration-300
              ${config.bg} border ${config.border}
            `}
          >
            {icon || defaultIcons[color]}
          </motion.div>
        </div>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </motion.div>
  );
};

export default StatCard;