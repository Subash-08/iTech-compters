import React, { useState, useEffect } from 'react';
import { Brand } from '../types/brand';
import { brandService } from '../services/brandService';
import { Icons } from '../Icon';
import { getImageUrl, getPlaceholderImage } from '../../utils/imageUtils';
import { toast } from 'react-toastify';

const HomeBrandManager: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
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
      const response = await brandService.getHomeShowcaseBrands();
      setBrands(response.brands);
    } catch (error) {
      console.error('Failed to fetch brands', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  // Handle "Featured" Toggle
  const handleToggleFeatured = async (brand: Brand) => {
    const newStatus = !brand.isFeatured;
    
    // 1. Optimistic Update
    setBrands(prev => prev.map(b => 
      b._id === brand._id ? { ...b, isFeatured: newStatus } : b
    ));

    try {
      // 2. API Call
      await brandService.updateHomeShowcaseSettings(brand._id, { isFeatured: newStatus });
      toast.success(newStatus ? 'Added to Showcase' : 'Removed from Showcase');
    } catch (error) {
      // Revert on error
      setBrands(prev => prev.map(b => 
        b._id === brand._id ? { ...b, isFeatured: !newStatus } : b
      ));
      toast.error('Failed to update status');
    }
  };

  // Handle Order Change
  const handleOrderSave = async (brandId: string, newValue: string) => {
    const numValue = parseInt(newValue);
    if (isNaN(numValue)) {
        setEditingOrder(null);
        return;
    }

    // 1. Optimistic Update & Sort
    setBrands(prev => {
      const updated = prev.map(b => 
        b._id === brandId ? { ...b, order: numValue } : b
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
      await brandService.updateHomeShowcaseSettings(brandId, { order: numValue });
    } catch (error) {
      toast.error('Failed to update order');
      fetchData(); // Refresh to ensure sync
    }
  };

  // Filter Logic
  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showcaseBrands = filteredBrands.filter(b => b.isFeatured);
  const availableBrands = filteredBrands; // Shows all active

  const displayList = activeTab === 'showcase' ? showcaseBrands : availableBrands;

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
          <h1 className="text-2xl font-bold text-gray-900">Homepage Brand Manager</h1>
          <p className="text-gray-500 mt-1">Select and arrange brands for the homepage slider.</p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search brands..."
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
          Showcase ({brands.filter(b => b.isFeatured).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Active Brands ({brands.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {displayList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icons.Image className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium">No brands found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'showcase' 
                ? "No brands are currently featured. Switch to 'All Active Brands' to add some." 
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
                  Brand Details
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
              {displayList.map((brand) => (
                <tr 
                  key={brand._id} 
                  className={`hover:bg-gray-50 transition-colors ${brand.isFeatured ? 'bg-blue-50/30' : ''}`}
                >
                  {/* 1. ORDER INPUT */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      {editingOrder?.id === brand._id ? (
                        <input
                          type="number"
                          autoFocus
                          className="w-16 border-blue-500 border-2 rounded px-2 py-1 text-sm font-semibold text-center outline-none"
                          value={editingOrder.value}
                          onChange={(e) => setEditingOrder({ id: brand._id, value: e.target.value })}
                          onBlur={(e) => handleOrderSave(brand._id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOrderSave(brand._id, (e.target as HTMLInputElement).value)}
                        />
                      ) : (
                        <div 
                          onClick={() => setEditingOrder({ id: brand._id, value: String(brand.order || 0) })}
                          className={`
                            w-16 py-1 px-2 text-sm font-medium rounded border cursor-pointer text-center transition-all
                            ${brand.isFeatured 
                              ? 'bg-white border-gray-300 hover:border-blue-400 text-gray-900' 
                              : 'bg-gray-100 border-transparent text-gray-400'}
                          `}
                          title="Click to edit order"
                        >
                          {brand.order || 0}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. BRAND DETAILS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-center">
                        {brand.logo ? (
                          <img
                            src={getImageUrl(brand.logo)}
                            alt={brand.name}
                            className="h-full w-full object-contain"
                            onError={(e) => { e.currentTarget.src = getPlaceholderImage('Brand'); }}
                          />
                        ) : (
                          <Icons.Image className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{brand.slug}</div>
                      </div>
                    </div>
                  </td>

                  {/* 3. FEATURED TOGGLE */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleFeatured(brand)}
                      className={`
                        p-2 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none
                        ${brand.isFeatured 
                          ? 'text-yellow-400 hover:bg-yellow-50 bg-yellow-50/50' 
                          : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'}
                      `}
                      title={brand.isFeatured ? "Remove from Home Page" : "Add to Home Page"}
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </td>

                  {/* 4. STATUS INDICATOR */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
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

export default HomeBrandManager;