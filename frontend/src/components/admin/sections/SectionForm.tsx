// src/pages/admin/sections/SectionForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Section, SectionFormData, LayoutType } from '../types/section';
import { sectionService } from '../services/sectionService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const SectionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing] = useState(!!id);

  const [formData, setFormData] = useState<SectionFormData>({
    title: '',
    description: '',
    layoutType: 'card',
    visible: true,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    maxWidth: '1200px',
    padding: { top: 40, bottom: 40, left: 0, right: 0 },
    gridConfig: { columns: 3, gap: 16 },
    sliderConfig: { autoplay: true, delay: 5000, loop: true, showNavigation: true, showPagination: true }
  });

  useEffect(() => {
    if (id) {
      fetchSection();
    }
  }, [id]);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await sectionService.getSection(id!);
      
      if (response.success) {
        const section = response.data.section;
        setFormData({
          title: section.title,
          description: section.description,
          layoutType: section.layoutType,
          visible: section.visible,
          backgroundColor: section.backgroundColor,
          textColor: section.textColor,
          maxWidth: section.maxWidth,
          padding: section.padding,
          gridConfig: section.gridConfig,
          sliderConfig: section.sliderConfig
        });
      } else {
        toast.error(response.message || 'Failed to fetch section');
        navigate('/admin/sections');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch section');
      navigate('/admin/sections');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (color: string, field: 'backgroundColor' | 'textColor') => {
    setFormData(prev => ({ ...prev, [field]: color }));
  };

  const handleNumberChange = (value: string, field: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handlePaddingChange = (value: string, side: keyof typeof formData.padding) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      padding: { ...prev.padding, [side]: numValue }
    }));
  };

  const handleGridConfigChange = (value: string, field: keyof typeof formData.gridConfig) => {
    const numValue = parseInt(value) || (field === 'columns' ? 3 : 16);
    setFormData(prev => ({
      ...prev,
      gridConfig: { ...prev.gridConfig, [field]: numValue }
    }));
  };

  const handleSliderConfigChange = (value: boolean | number, field: keyof typeof formData.sliderConfig) => {
    setFormData(prev => ({
      ...prev,
      sliderConfig: { ...prev.sliderConfig, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    setSaving(true);

    try {
      let response;
      
      if (isEditing && id) {
        response = await sectionService.updateSection(id, formData);
      } else {
        response = await sectionService.createSection(formData);
      }

      if (response.success) {
        toast.success(`Section ${isEditing ? 'updated' : 'created'} successfully`);
        navigate('/admin/sections');
      } else {
        toast.error(response.message || `Failed to ${isEditing ? 'update' : 'create'} section`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} section`);
    } finally {
      setSaving(false);
    }
  };

  const layoutTypes: { value: LayoutType; label: string; description: string }[] = [
    { value: 'card', label: 'Card Layout', description: 'Multiple videos in card format with equal sizing' },
    { value: 'full-video', label: 'Full Video', description: 'Single video displayed full-width with autoplay' },
    { value: 'slider', label: 'Slider', description: 'Multiple videos in a horizontal slider/carousel' },
    { value: 'grid', label: 'Grid Layout', description: 'Videos arranged in a fixed grid (2x2, 3x3, etc.)' },
    { value: 'masonry', label: 'Masonry Layout', description: 'Videos in a Pinterest-style masonry layout' },
     { value: 'reels', label: 'Reels Layout', description: 'Vertical scrolling videos like Instagram Reels/TikTok' } 
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/sections')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sections
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditing ? 'Edit Section' : 'Create New Section'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update section details and layout' : 'Configure a new homepage video section'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Type *
                </label>
                <select
                  name="layoutType"
                  value={formData.layoutType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {layoutTypes.map((layout) => (
                    <option key={layout.value} value={layout.value}>
                      {layout.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter section description (optional)"
                />
              </div>
            </div>
          </div>

          {/* Layout Configuration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Layout Configuration</h2>
            
            {/* Layout Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Layout: {
                layoutTypes.find(l => l.value === formData.layoutType)?.label
              }</h3>
              <p className="text-sm text-gray-600 mb-4">
                {layoutTypes.find(l => l.value === formData.layoutType)?.description}
              </p>
              
              {/* Simple Layout Preview */}
              <div className="flex items-center justify-center h-32 bg-white rounded border border-gray-200">
                {formData.layoutType === 'card' && (
                  <div className="flex space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-24 h-16 bg-blue-100 border border-blue-200 rounded"></div>
                    ))}
                  </div>
                )}
                {formData.layoutType === 'full-video' && (
                  <div className="w-48 h-16 bg-blue-100 border border-blue-200 rounded"></div>
                )}
                {formData.layoutType === 'slider' && (
                  <div className="relative w-48 h-16">
                    <div className="absolute left-0 w-24 h-16 bg-blue-100 border border-blue-200 rounded"></div>
                    <div className="absolute right-0 w-24 h-16 bg-blue-50 border border-blue-200 rounded"></div>
                  </div>
                )}
                {formData.layoutType === 'grid' && (
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-8 h-6 bg-blue-100 border border-blue-200 rounded"></div>
                    ))}
                  </div>
                )}
                {formData.layoutType === 'masonry' && (
                  <div className="flex space-x-1">
                    <div className="w-8 h-12 bg-blue-100 border border-blue-200 rounded"></div>
                    <div className="w-8 h-8 bg-blue-100 border border-blue-200 rounded"></div>
                    <div className="w-8 h-10 bg-blue-100 border border-blue-200 rounded"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Layout-specific settings */}
            {formData.layoutType === 'grid' && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Grid Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Columns
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={formData.gridConfig.columns}
                      onChange={(e) => handleGridConfigChange(e.target.value, 'columns')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of columns in the grid (1-6)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gap (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.gridConfig.gap}
                      onChange={(e) => handleGridConfigChange(e.target.value, 'gap')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Space between grid items in pixels</p>
                  </div>
                </div>
              </div>
            )}

            {formData.layoutType === 'reels' && (
    <div className="flex flex items-center justify-center space-y-2">
        {[1, 2, 3].map(i => (
            <div key={i} className="w-24 h-32 bg-gradient-to-b from-purple-400 to-pink-400 border border-purple-200 rounded-lg"></div>
        ))}
    </div>
)}

            {formData.layoutType === 'slider' && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Slider Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="slider-autoplay"
                      checked={formData.sliderConfig.autoplay}
                      onChange={(e) => handleSliderConfigChange(e.target.checked, 'autoplay')}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="slider-autoplay" className="ml-2 text-sm text-gray-700">
                      Enable autoplay
                    </label>
                  </div>
                  
                  {formData.sliderConfig.autoplay && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Autoplay Delay (ms)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={formData.sliderConfig.delay}
                        onChange={(e) => handleSliderConfigChange(parseInt(e.target.value), 'delay')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Time between slides in milliseconds</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="slider-loop"
                      checked={formData.sliderConfig.loop}
                      onChange={(e) => handleSliderConfigChange(e.target.checked, 'loop')}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="slider-loop" className="ml-2 text-sm text-gray-700">
                      Loop slides
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="slider-navigation"
                      checked={formData.sliderConfig.showNavigation}
                      onChange={(e) => handleSliderConfigChange(e.target.checked, 'showNavigation')}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="slider-navigation" className="ml-2 text-sm text-gray-700">
                      Show navigation arrows
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="slider-pagination"
                      checked={formData.sliderConfig.showPagination}
                      onChange={(e) => handleSliderConfigChange(e.target.checked, 'showPagination')}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="slider-pagination" className="ml-2 text-sm text-gray-700">
                      Show pagination dots
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Display Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Display Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => handleColorChange(e.target.value, 'backgroundColor')}
                      className="w-10 h-10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => handleColorChange(e.target.value, 'backgroundColor')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => handleColorChange(e.target.value, 'textColor')}
                      className="w-10 h-10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.textColor}
                      onChange={(e) => handleColorChange(e.target.value, 'textColor')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Width
                  </label>
                  <select
                    value={formData.maxWidth}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxWidth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="100%">Full Width</option>
                    <option value="1200px">Large (1200px)</option>
                    <option value="1024px">Medium (1024px)</option>
                    <option value="768px">Small (768px)</option>
                    <option value="640px">Extra Small (640px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="section-visible"
                      checked={formData.visible}
                      onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="section-visible" className="ml-2 text-sm text-gray-700">
                      Show this section on homepage
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Padding Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Padding (px)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Top
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.padding.top}
                    onChange={(e) => handlePaddingChange(e.target.value, 'top')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bottom
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.padding.bottom}
                    onChange={(e) => handlePaddingChange(e.target.value, 'bottom')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Left
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.padding.left}
                    onChange={(e) => handlePaddingChange(e.target.value, 'left')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Right
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.padding.right}
                    onChange={(e) => handlePaddingChange(e.target.value, 'right')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/sections')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : (isEditing ? 'Update Section' : 'Create Section')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SectionForm;