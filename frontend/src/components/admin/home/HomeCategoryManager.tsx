import React, { useState, useEffect } from 'react';
import { Category } from '../types/category';
import { categoryAPI } from '../services/categoryAPI';
import { Icons } from '../Icon'; // Ensure you have access to your icons
import { getImageUrl, getPlaceholderImage } from '../../utils/imageUtils';
import { toast } from 'react-toastify';

const HomeCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'showcase' | 'all'>('showcase');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for tracking order inputs while typing
  const [editingOrder, setEditingOrder] = useState<{ id: string, value: string } | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getHomeShowcaseCategories();
      // Ensure we set categories from the response array
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Handle "Featured" Toggle
  const handleToggleFeatured = async (category: Category) => {
    const newStatus = !category.isFeatured;
    
    // 1. Optimistic Update
    setCategories(prev => prev.map(cat => 
      cat._id === category._id ? { ...cat, isFeatured: newStatus } : cat
    ));

    try {
      // 2. API Call
      await categoryAPI.updateHomeShowcaseCategorySettings(category._id, { isFeatured: newStatus });
      toast.success(newStatus ? 'Added to Showcase' : 'Removed from Showcase');
    } catch (error) {
      // Revert on error
      setCategories(prev => prev.map(cat => 
        cat._id === category._id ? { ...cat, isFeatured: !newStatus } : cat
      ));
      toast.error('Failed to update status');
    }
  };

  // Handle Order Change
  const handleOrderSave = async (categoryId: string, newValue: string) => {
    const numValue = parseInt(newValue);
    if (isNaN(numValue)) {
        setEditingOrder(null);
        return;
    }

    // 1. Optimistic Update & Sort
    setCategories(prev => {
      const updated = prev.map(cat => 
        cat._id === categoryId ? { ...cat, order: numValue } : cat
      );
      // Re-sort immediately: Featured -> Order -> Name
      return updated.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
        return a.name.localeCompare(b.name);
      });
    });

    setEditingOrder(null);

    try {
      // 2. API Call
      await categoryAPI.updateHomeShowcaseCategorySettings(categoryId, { order: numValue });
    } catch (error) {
      toast.error('Failed to update order');
      fetchData(); // Refresh to ensure sync
    }
  };

  // Filter Logic
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showcaseCategories = filteredCategories.filter(cat => cat.isFeatured);
  const availableCategories = filteredCategories; // Shows all active

  const displayList = activeTab === 'showcase' ? showcaseCategories : availableCategories;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Icons.Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Category Manager</h1>
          <p className="text-gray-500 mt-1">Select and arrange categories for the homepage grid.</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
          <Icons.Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('showcase')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'showcase' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Showcase ({categories.filter(c => c.isFeatured).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Active Categories ({categories.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {displayList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icons.Layout className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium">No categories found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'showcase' 
                ? "No categories are currently featured. Switch to 'All Active Categories' to add some." 
                : "Try adjusting your search query."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Details
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Featured
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayList.map((category) => (
                <tr 
                  key={category._id} 
                  className={`hover:bg-gray-50 transition-colors ${category.isFeatured ? 'bg-blue-50/30' : ''}`}
                >
                  {/* 1. ORDER INPUT */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      {editingOrder?.id === category._id ? (
                        <input
                          type="number"
                          autoFocus
                          className="w-16 border-blue-500 border-2 rounded px-2 py-1 text-sm font-semibold text-center outline-none"
                          value={editingOrder.value}
                          onChange={(e) => setEditingOrder({ id: category._id, value: e.target.value })}
                          onBlur={(e) => handleOrderSave(category._id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOrderSave(category._id, (e.target as HTMLInputElement).value)}
                        />
                      ) : (
                        <div 
                          onClick={() => setEditingOrder({ id: category._id, value: String(category.order || 0) })}
                          className={`
                            w-16 py-1 px-2 text-sm font-medium rounded border cursor-pointer text-center transition-all
                            ${category.isFeatured 
                              ? 'bg-white border-gray-300 hover:border-blue-400 text-gray-900' 
                              : 'bg-gray-100 border-transparent text-gray-400'}
                          `}
                          title="Click to edit order"
                        >
                          {category.order || 0}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. CATEGORY DETAILS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            className="h-full w-full object-contain"
                            onError={(e) => { e.currentTarget.src = getPlaceholderImage('Category'); }}
                          />
                        ) : (
                          <Icons.Image className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{category.slug}</div>
                      </div>
                    </div>
                  </td>

                  {/* 3. FEATURED TOGGLE */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleFeatured(category)}
                      className={`
                        p-2 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none
                        ${category.isFeatured 
                          ? 'text-yellow-400 hover:bg-yellow-50 bg-yellow-50/50' 
                          : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'}
                      `}
                      title={category.isFeatured ? "Remove from Home Page" : "Add to Home Page"}
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </td>

                  {/* 4. STATUS INDICATOR */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {category.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HomeCategoryManager;