// components/admin/common/LoadingSpinner.tsx
import React from 'react';
import { Icons } from '../Icon';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'slate' | 'muted';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const ringMap = {
    primary: 'border-indigo-500/30 border-t-indigo-600',
    white: 'border-white/30 border-t-white',
    slate: 'border-slate-400/30 border-t-slate-700',
    muted: 'border-slate-300/20 border-t-slate-400'
  };

  const textColorMap = {
    primary: 'text-slate-600',
    white: 'text-white/80',
    slate: 'text-slate-500',
    muted: 'text-slate-400'
  };

  const spinner = (
    <div className={clsx(
      'flex flex-col items-center justify-center gap-4',
      className
    )}>
      {/* Outer Ring */}
      <div
        className={clsx(
          'relative rounded-full border-2 animate-spin',
          sizeMap[size],
          ringMap[variant]
        )}
      >
        {/* Inner Dot */}
        <span className="
          absolute inset-0 
          m-auto 
          w-1.5 h-1.5 
          rounded-full 
          bg-current
          opacity-70
        " />
      </div>

      {text && (
        <span
          className={clsx(
            'text-sm font-medium tracking-wide',
            textColorMap[variant]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="
        fixed inset-0 z-50 
        flex items-center justify-center
        bg-white/70 backdrop-blur-md
      ">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
