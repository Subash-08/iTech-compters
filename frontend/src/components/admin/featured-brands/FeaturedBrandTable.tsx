// components/admin/featured-brands/FeaturedBrandTable.tsx
import React, { useState } from 'react';
import { FeaturedBrand } from '../types/featuredBrand';
import { getImageUrl } from '../../utils/imageUtils';

// Safe icon fallbacks in case Icons are not available
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  Image: ({ className }: { className?: string }) => (
    <div className={className}>🖼️</div>
  ),
  Eye: ({ className }: { className?: string }) => (
    <div className={className}>👁️</div>
  ),
  MousePointer: ({ className }: { className?: string }) => (
    <div className={className}>🖱️</div>
  ),
  Edit: ({ className }: { className?: string }) => (
    <div className={className}>✏️</div>
  ),
  Trash2: ({ className }: { className?: string }) => (
    <div className={className}>🗑️</div>
  ),
};

interface FeaturedBrandTableProps {
  brands: FeaturedBrand[];
  loading: boolean;
  onStatusToggle: (brandId: string, currentStatus: 'active' | 'inactive') => void;
  onEdit: (brand: FeaturedBrand) => void;
  onDelete: (brandId: string) => void;
  onDisplayOrderUpdate: (orderedBrands: FeaturedBrand[]) => void;
}

const FeaturedBrandTable: React.FC<FeaturedBrandTableProps> = ({
  brands,
  loading,
  onStatusToggle,
  onEdit,
  onDelete,
  onDisplayOrderUpdate,
}) => {
  const [localBrands, setLocalBrands] = useState(brands);

  // Update local brands when props change
  React.useEffect(() => {
    setLocalBrands(brands);
  }, [brands]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <SafeIcons.Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-gray-600">Loading featured brands...</p>
      </div>
    );
  }

  if (localBrands.length === 0) {
    return (
      <div className="p-8 text-center">
        <SafeIcons.Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No featured brands yet</h3>
        <p className="text-gray-600 mb-4">Add your first brand to display in the "Trusted by Leading Brands" section</p>
        <p className="text-sm text-gray-500">
          The section will automatically appear on the website once you add active brands with logos
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Brand
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Logo Preview
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Display Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {localBrands.map((brand, index) => (
            <tr key={brand._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 text-center">
                  {index + 1}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {brand.name}
                    </div>
                    {brand.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {brand.description}
                      </div>
                    )}
                    {brand.websiteUrl && (
                      <div className="text-xs text-blue-600 truncate max-w-xs">
                        {brand.websiteUrl}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="w-24 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {brand.logo?.url ? (
                    <img
                      src={getImageUrl(brand.logo.url)}
                      alt={brand.logo.altText || brand.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                        e.currentTarget.className = 'w-full h-full object-contain opacity-50';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <SafeIcons.Image className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-sm text-gray-900 font-medium">
                    {brand.displayOrder + 1}
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Position
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onStatusToggle(brand._id, brand.status)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                    brand.status === 'active'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {brand.isActive ? 'Active' : 'Inactive'}
                  <span className="ml-1">
                    {brand.status === 'active' ? '✓' : '✗'}
                  </span>
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(brand)}
                    className="text-blue-600 hover:text-blue-900 p-1 transition-colors duration-200"
                    title="Edit brand"
                  >
                    <SafeIcons.Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(brand._id)}
                    className="text-red-600 hover:text-red-900 p-1 transition-colors duration-200"
                    title="Delete brand"
                  >
                    <SafeIcons.Trash2 className="w-4 h-4" />
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

export default FeaturedBrandTable;