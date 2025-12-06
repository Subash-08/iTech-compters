import React from 'react';
import { Brand } from '../types/brand';
import { Icons } from '../Icon';
import { getImageUrl, getPlaceholderImage } from '../../utils/imageUtils';

interface BrandTableProps {
  brands: Brand[];
  loading: boolean;
  onStatusToggle: (brandId: string, currentStatus: 'active' | 'inactive') => void;
  onEdit: (brand: Brand) => void;
}

const BrandTable: React.FC<BrandTableProps> = ({
  brands,
  loading,
  onStatusToggle,
  onEdit,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <Icons.Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-gray-600">Loading brands...</p>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="mt-2 text-gray-600">No brands found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Brand
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {brands.map((brand) => (
            <tr key={brand._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {brand.logo ? (
                      <img
                        src={getImageUrl(brand.logo)}
                        alt={brand.logo.altText || brand.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          console.error('Failed to load brand logo:', brand.logo?.url);
                          e.currentTarget.src = getPlaceholderImage('Brand');
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <Icons.Image className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {brand.name}
                    </div>
                    {brand.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {brand.description}
                      </div>
                    )}
                  </div>
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
                  {brand.status === 'active' ? 'Active' : 'Inactive'}
                  {brand.deactivationReason && brand.status === 'inactive' && (
                    <span className="ml-1" title={`Reason: ${brand.deactivationReason}`}>
                      <Icons.Info className="w-3 h-3" />
                    </span>
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(brand.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(brand)}
                    className="text-blue-600 hover:text-blue-900 p-1 transition-colors duration-200"
                    title="Edit brand"
                  >
                    <Icons.Edit className="w-4 h-4" />
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

export default BrandTable;