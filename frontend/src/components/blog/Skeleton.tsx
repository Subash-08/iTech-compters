// src/components/ui/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  count = 1 
}) => {
  const skeletonClasses = `bg-gray-200 animate-pulse rounded ${className}`;
  
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index} 
            className={skeletonClasses}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </>
    );
  }
  
  return <div className={skeletonClasses} />;
};

// Individual skeleton components for different use cases
export const TextSkeleton: React.FC<{ 
  lines?: number; 
  className?: string 
}> = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index} 
        className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{
  withImage?: boolean;
  withActions?: boolean;
}> = ({ withImage = true, withActions = true }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    {withImage && (
      <Skeleton className="h-48 w-full rounded-none" />
    )}
    <div className="p-6">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      {withActions && (
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      )}
    </div>
  </div>
);

export const BlogCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
        <Skeleton className="h-48 w-full" />
        <div className="p-6">
          <div className="flex items-center text-sm mb-3">
            <Skeleton className="h-4 w-24 mr-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-3" />
          <div className="space-y-2 mb-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    ))}
  </>
);

export const BlogDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Skeleton */}
    <div className="bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6 bg-blue-500/30" />
          <Skeleton className="h-12 w-full mb-4 bg-white/20" />
          <Skeleton className="h-12 w-3/4 mb-4 bg-white/20" />
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-4 w-24 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>
          <Skeleton className="h-96 w-full bg-blue-500/30 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-8">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Table skeleton for admin lists
export const TableSkeleton: React.FC<{
  columns: number;
  rows: number;
  withCheckbox?: boolean;
}> = ({ columns, rows, withCheckbox = true }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {withCheckbox && (
              <th className="px-6 py-3">
                <Skeleton className="h-4 w-4 mx-auto" />
              </th>
            )}
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton className="h-4 w-24 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {withCheckbox && (
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton 
                    className={`h-4 ${
                      colIndex === 0 ? 'w-48' : 
                      colIndex === columns - 1 ? 'w-32' : 
                      'w-24'
                    }`} 
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC<{
  fields?: number;
  withSidebar?: boolean;
}> = ({ fields = 5, withSidebar = true }) => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${withSidebar ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      
      {withSidebar && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default Skeleton;