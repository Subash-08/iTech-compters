// components/ProductCardShimmer.tsx
import React from 'react';

const ProductCardShimmer: React.FC = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-gray-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Brand */}
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                </div>

                {/* Title */}
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                    <div className="h-4 bg-gray-200 rounded w-16 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                    </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                    <div className="h-6 bg-gray-200 rounded w-20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                    </div>
                </div>

                {/* Button */}
                <div className="h-10 bg-gray-200 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardShimmer;