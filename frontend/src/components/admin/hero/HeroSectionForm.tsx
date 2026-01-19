// src/components/admin/hero/HeroSectionForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { heroSectionService, HeroSectionFormData } from '../services/heroSectionService';

// Safe icon fallbacks
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div className={className}>←</div>
  ),
};

const HeroSectionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<HeroSectionFormData>({
    name: '',
    autoPlay: true,
    autoPlaySpeed: 5000,
    transitionEffect: 'slide',
    showNavigation: true,
    showPagination: true,
    order: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isEdit && id) {
      loadHeroSection();
    } else {
      // Set default order for new sections
      loadDefaultOrder();
    }
  }, [isEdit, id]);

  const loadDefaultOrder = async () => {
    try {
      const response = await heroSectionService.getAllHeroSections();
      if (response.success) {
        const sections = response.data;
        const maxOrder = sections.reduce((max: number, section: any) => 
          Math.max(max, section.order || 0), 0
        );
        setFormData(prev => ({
          ...prev,
          order: maxOrder + 1
        }));
      }
    } catch (error) {
      console.error('Failed to load sections for order calculation:', error);
    }
  };

  const loadHeroSection = async () => {
    try {
      setLoading(true);
      const response = await heroSectionService.getHeroSectionById(id!);
      if (response.success) {
        const section = response.data;
        setFormData({
          name: section.name,
          autoPlay: section.autoPlay,
          autoPlaySpeed: section.autoPlaySpeed,
          transitionEffect: section.transitionEffect,
          showNavigation: section.showNavigation,
          showPagination: section.showPagination,
          order: section.order || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Section name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEdit && id) {
        await heroSectionService.updateHeroSection(id, formData);
      } else {
        await heroSectionService.createHeroSection(formData);
      }
      navigate('/admin/hero-sections');
    } catch (err: any) {
      setError(err.message || 'Failed to save hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof HeroSectionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/hero-sections')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <SafeIcons.ArrowLeft className="w-4 h-4" />
          <span>Back to Hero Sections</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Hero Section' : 'Create Hero Section'}
        </h1>
        <p className="text-gray-600">
          {isEdit 
            ? 'Update your hero section settings' 
            : 'Create a new hero section for your website'
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Section Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Homepage Hero, Festival Banner"
              />
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                id="order"
                min="0"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Lower numbers appear first. Set to 0 for automatic ordering.</p>
            </div>
          </div>
        </div>

        {/* Slider Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Slider Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Play */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto Play
                </label>
                <p className="text-sm text-gray-500">Automatically transition between slides</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('autoPlay', !formData.autoPlay)}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  formData.autoPlay ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                    formData.autoPlay ? 'transform translate-x-7' : 'transform translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Play Speed */}
            <div>
              <label htmlFor="autoPlaySpeed" className="block text-sm font-medium text-gray-700 mb-2">
                Auto Play Speed (ms)
              </label>
              <input
                type="number"
                id="autoPlaySpeed"
                min="1000"
                max="15000"
                step="500"
                value={formData.autoPlaySpeed}
                onChange={(e) => handleChange('autoPlaySpeed', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Time between slide transitions (1000-15000ms)</p>
            </div>

            {/* Transition Effect */}
            <div>
              <label htmlFor="transitionEffect" className="block text-sm font-medium text-gray-700 mb-2">
                Transition Effect
              </label>
              <select
                id="transitionEffect"
                value={formData.transitionEffect}
                onChange={(e) => handleChange('transitionEffect', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
                <option value="cube">Cube</option>
                <option value="coverflow">Coverflow</option>
              </select>
            </div>

            {/* Navigation Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Navigation
                  </label>
                  <p className="text-sm text-gray-500">Previous/Next buttons</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('showNavigation', !formData.showNavigation)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    formData.showNavigation ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      formData.showNavigation ? 'transform translate-x-7' : 'transform translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Pagination
                  </label>
                  <p className="text-sm text-gray-500">Slide indicator dots</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('showPagination', !formData.showPagination)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    formData.showPagination ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                      formData.showPagination ? 'transform translate-x-7' : 'transform translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/hero-sections')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <SafeIcons.Loader className="w-4 h-4 animate-spin" />}
            <span>{isEdit ? 'Update' : 'Create'} Hero Section</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HeroSectionForm;