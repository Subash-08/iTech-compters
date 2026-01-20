import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PreBuildShowcaseItem } from '../types/preBuildShowcase';
import { preBuildShowcaseService } from '../services/preBuildShowcaseService';
import PreBuildShowcaseTable from './PreBuildShowcaseTable';
import { Icons } from '../Icon';
import { toast } from 'react-toastify';

const PreBuildShowcaseList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<PreBuildShowcaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await preBuildShowcaseService.getAdminShowcaseItems();
      setItems(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await preBuildShowcaseService.deleteItem(id);
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Build Showcase</h1>
          <p className="text-gray-600">Manage the Pre-Build PC banner section</p>
        </div>
        <button
          onClick={() => navigate('/admin/pre-build-showcase/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <PreBuildShowcaseTable
          items={items}
          loading={loading}
          onDelete={handleDelete}
          onEdit={(id) => navigate(`/admin/pre-build-showcase/edit/${id}`)}
        />
      </div>
    </div>
  );
};

export default PreBuildShowcaseList;