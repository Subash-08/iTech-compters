import React from 'react';
import { toast } from 'react-toastify';
import { Category } from '../types/category';
import StatusBadge from '../common/StatusBadge';
import { Icons } from '../Icon';
import { baseURL } from '../../config/config';

interface CategoryTableProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  onStatusToggle: (id: string, currentStatus: string) => void;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  onStatusToggle,
  onDelete,
  onEdit
}) => {
  // Get full image URL helper function
  const getImageUrl = (url: string | null | undefined): string => {
    if (!url || typeof url !== 'string') {
      return 'https://placehold.co/80x80?text=📁';
    }

    if (url.startsWith('http')) {
      return url;
    }

    const baseUrl = baseURL;

    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleStatusToggleWithToast = async (id: string, currentStatus: string, categoryName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activated' : 'deactivated';
    
    try {
      const toastId = toast.loading(`${action === 'activating' ? 'Activating' : 'Deactivating'} "${categoryName}"...`);
      
      await onStatusToggle(id, currentStatus);
      
      toast.update(toastId, {
        render: `"${categoryName}" ${action} successfully`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true,
      });
    } catch (error) {
      toast.error(`Failed to ${action} "${categoryName}"`);
    }
  };

  const handleDeleteWithToast = (id: string, name: string) => {
    toast.warning(
      <div>
        <p className="font-semibold">Deactivate Category?</p>
        <p className="text-sm mt-1">Are you sure you want to deactivate "{name}"?</p>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => {
              toast.dismiss();
              onDelete(id, name);
              toast.info(`"${name}" deactivated successfully`);
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Yes, Deactivate
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: true,
        draggable: false,
      }
    );
  };

  const handleEditWithToast = (id: string, name: string) => {
    toast.info(`Editing "${name}"`, { autoClose: 2000 });
    onEdit(id);
  };

  const getParentName = (parent: Category | string | undefined) => {
    if (!parent) return '-';
    if (typeof parent === 'string') return 'Loading...';
    return parent.name;
  };

  const getProductCountText = (count: number) => {
    if (count === 0) return 'No products';
    if (count === 1) return '1 product';
    return `${count} products`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr 
                key={category._id} 
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {/* Category Image */}
                    <div className="flex-shrink-0">
                      {category.image?.url ? (
                        <div className="relative">
                          <img
                            src={getImageUrl(category.image.url)}
                            alt={category.image.altText || category.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              console.error('Failed to load category image:', category.image?.url);
                              e.currentTarget.src = 'https://placehold.co/40x40?text=📁';
                              e.currentTarget.className = 'w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center';
                            }}
                          />
                          {category.status === 'inactive' && (
                            <div className="absolute inset-0 bg-gray-400 bg-opacity-50 rounded-lg flex items-center justify-center">
                              <Icons.EyeOff className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          category.status === 'active' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-600'
                        }`}>
                          <Icons.Folder className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Category Info */}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                        <span>{category.name}</span>
                        {category.status === 'inactive' && (
                          <Icons.EyeOff className="w-3 h-3 text-gray-400" title="Inactive" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>/ {category.slug}</span>
                        {category.description && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-400 truncate max-w-xs">
                              {category.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-900">
                  {getParentName(category.parentCategory)}
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (category.productCount || 0) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getProductCountText(category.productCount || 0)}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <StatusBadge status={category.status} />
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>{new Date(category.updatedAt).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(category.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditWithToast(category._id, category.name)}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                      title={`Edit ${category.name}`}
                    >
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                    
                    {/* Status Toggle Button */}
                    <button
                      onClick={() => handleStatusToggleWithToast(category._id, category.status, category.name)}
                      className={`transition-colors duration-200 p-1 rounded ${
                        category.status === 'active' 
                          ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={category.status === 'active' ? `Deactivate ${category.name}` : `Activate ${category.name}`}
                    >
                      {category.status === 'active' ? (
                        <Icons.EyeOff className="w-4 h-4" />
                      ) : (
                        <Icons.Eye className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteWithToast(category._id, category.name)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded hover:bg-red-50"
                      title={`Deactivate ${category.name}`}
                      disabled={category.status === 'inactive'}
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <Icons.Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTable;