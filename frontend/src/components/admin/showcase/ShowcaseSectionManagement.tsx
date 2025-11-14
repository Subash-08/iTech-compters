// src/components/admin/showcase/ShowcaseSectionManagement.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, SlidersHorizontal } from 'lucide-react';
import { ShowcaseSection, ShowcaseSectionFormData } from '../types/showcaseSection';
import { showcaseSectionService } from '../services/showcaseSectionService';
import ShowcaseSectionList from './ShowcaseSectionList';
import ShowcaseSectionForm from './ShowcaseSectionForm';
import LoadingSpinner from '../../common/LoadingSpinner';
import EmptyState from '../../common/EmptyState';

const ShowcaseSectionManagement: React.FC = () => {
  const [sections, setSections] = useState<ShowcaseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<ShowcaseSection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchSections();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await showcaseSectionService.getAdminSections({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setSections(response.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (data: ShowcaseSectionFormData) => {
    try {
      await showcaseSectionService.createSection(data);
      setShowForm(false);
      fetchSections();
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  };

  const handleUpdateSection = async (data: ShowcaseSectionFormData) => {
    if (!editingSection) return;
    
    try {
      await showcaseSectionService.updateSection(editingSection._id, data);
      setEditingSection(null);
      fetchSections();
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  };

  const handleDeleteSection = async (section: ShowcaseSection) => {
    if (!window.confirm(`Are you sure you want to delete "${section.title}"?`)) {
      return;
    }

    try {
      await showcaseSectionService.deleteSection(section._id);
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Error deleting section. Please try again.');
    }
  };

  const handleToggleStatus = async (section: ShowcaseSection) => {
    try {
      await showcaseSectionService.toggleSectionStatus(section._id);
      fetchSections();
    } catch (error) {
      console.error('Error toggling section status:', error);
    }
  };

  const handleEdit = (section: ShowcaseSection) => {
    setEditingSection(section);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSection(null);
  };

  if (showForm || editingSection) {
    return (
      <ShowcaseSectionForm
        section={editingSection || undefined}
        onSubmit={editingSection ? handleUpdateSection : handleCreateSection}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Showcase Sections</h1>
          <p className="text-gray-600 mt-1">
            Manage product showcase sections for your store
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Section
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="grid">Grid Layout</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Grid className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sections</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Grid Layouts</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter(s => s.type === 'grid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Carousels</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter(s => s.type === 'carousel').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <ShowcaseSectionList
        sections={sections}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteSection}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default ShowcaseSectionManagement;