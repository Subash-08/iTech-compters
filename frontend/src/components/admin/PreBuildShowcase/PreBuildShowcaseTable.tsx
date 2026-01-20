import React from 'react';
import { PreBuildShowcaseItem } from '../types/preBuildShowcase';
import { Icons } from '../Icon';
import { getImageUrl } from '../../utils/imageUtils';

interface Props {
  items: PreBuildShowcaseItem[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PreBuildShowcaseTable: React.FC<Props> = ({ items, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <Icons.Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-gray-600">Loading showcase items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="p-8 text-center text-gray-600">No items found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title / Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layout</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  className="w-24 h-14 object-cover rounded-md border border-gray-200"
                />
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.category}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-brand-red font-semibold">{item.price}</div>
                <div className="text-xs text-gray-400">Order: {item.order}</div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.isWide ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.isWide ? 'Wide (4 Col)' : 'Standard (1 Col)'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(item._id)} className="text-blue-600 hover:text-blue-900 p-1">
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(item._id)} className="text-red-600 hover:text-red-900 p-1">
                    <Icons.Trash className="w-4 h-4" />
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

export default PreBuildShowcaseTable;