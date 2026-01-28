// src/components/admin/showcase/ShowcaseSectionForm.tsx
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Clock, Palette, Eye, Plus, X, Check } from 'lucide-react';
import { ShowcaseSection, ShowcaseSectionFormData, TimerConfig, StyleConfig, VisibilityConfig } from '../types/showcaseSection';
import { Product } from '../types/product';
import ProductSelectionModal from './ProductSelectionModal';

interface ShowcaseSectionFormProps {
  section?: ShowcaseSection;
  onSubmit: (data: ShowcaseSectionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ShowcaseSectionForm: React.FC<ShowcaseSectionFormProps> = ({
  section,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<ShowcaseSectionFormData>({
    title: '',
    subtitle: '',
    type: 'grid',
    products: [],
    displayOrder: 0,
    isActive: true,
    showViewAll: true,
    viewAllLink: '',
    timerConfig: {
      hasTimer: false,
      endDate: '',
      timerText: 'Ends in'
    },
    styleConfig: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#007bff',
      cardStyle: 'modern'
    },
    visibility: {
      isPublic: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      showOnHomepage: true,
      showInCategory: []
    }
  });

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        subtitle: section.subtitle || '',
        type: section.type,
        products: section.products.map(p => p._id),
        displayOrder: section.displayOrder,
        isActive: section.isActive,
        showViewAll: section.showViewAll,
        viewAllLink: '',
        timerConfig: section.timerConfig,
        styleConfig: section.styleConfig,
        visibility: section.visibility
      });
      setSelectedProducts(section.products);
    }
  }, [section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleProductSelect = (products: Product[]) => {
    setSelectedProducts(products);
    setFormData(prev => ({
      ...prev,
      products: products.map(p => p._id)
    }));
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(p => p._id !== productId);
    setSelectedProducts(updatedProducts);
    setFormData(prev => ({
      ...prev,
      products: updatedProducts.map(p => p._id)
    }));
  };

  const updateTimerConfig = (updates: Partial<TimerConfig>) => {
    setFormData(prev => ({
      ...prev,
      timerConfig: { ...prev.timerConfig, ...updates }
    }));
  };

  const updateStyleConfig = (updates: Partial<StyleConfig>) => {
    setFormData(prev => ({
      ...prev,
      styleConfig: { ...prev.styleConfig, ...updates }
    }));
  };

  const updateVisibilityConfig = (updates: Partial<VisibilityConfig>) => {
    setFormData(prev => ({
      ...prev,
      visibility: { ...prev.visibility, ...updates }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {section ? 'Edit Showcase Section' : 'Create Showcase Section'}
            </h1>
            <p className="text-gray-600 mt-1">
              {section ? 'Update your product showcase section' : 'Create a new product showcase section'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Most Popular Graphics Cards"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Best selling products this month"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layout Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'grid' | 'carousel' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="grid">Grid Layout</option>
                  <option value="carousel">Carousel/Horizontal Scroll</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Select Products
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No products selected</p>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Click to select products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {product.images?.thumbnail?.url ? (
                        <img
                          src={product.images.thumbnail.url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">R{product.offerPrice || product.basePrice}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {selectedProducts.length} product(s) selected
          </p>
        </div>

        {/* Timer Configuration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Timer Configuration</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasTimer"
                checked={formData.timerConfig.hasTimer}
                onChange={(e) => updateTimerConfig({ hasTimer: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasTimer" className="text-sm font-medium text-gray-700">
                Enable countdown timer
              </label>
            </div>

            {formData.timerConfig.hasTimer && (
              <div className="grid grid-cols-2 gap-6 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.timerConfig.endDate}
                    onChange={(e) => updateTimerConfig({ endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timer Text
                  </label>
                  <input
                    type="text"
                    value={formData.timerConfig.timerText}
                    onChange={(e) => updateTimerConfig({ timerText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ends in, Sale ends, etc."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Styling Options */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Styling Options</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.styleConfig.backgroundColor}
                  onChange={(e) => updateStyleConfig({ backgroundColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.styleConfig.backgroundColor}
                  onChange={(e) => updateStyleConfig({ backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.styleConfig.textColor}
                  onChange={(e) => updateStyleConfig({ textColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.styleConfig.textColor}
                  onChange={(e) => updateStyleConfig({ textColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.styleConfig.accentColor}
                  onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.styleConfig.accentColor}
                  onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Style
              </label>
              <select
                value={formData.styleConfig.cardStyle}
                onChange={(e) => updateStyleConfig({ cardStyle: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="elegant">Elegant</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Visibility Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.visibility.isPublic}
                onChange={(e) => updateVisibilityConfig({ isPublic: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Publicly visible
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showOnHomepage"
                checked={formData.visibility.showOnHomepage}
                onChange={(e) => updateVisibilityConfig({ showOnHomepage: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showOnHomepage" className="text-sm font-medium text-gray-700">
                Show on homepage
              </label>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.visibility.startDate}
                  onChange={(e) => updateVisibilityConfig({ startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.visibility.endDate || ''}
                  onChange={(e) => updateVisibilityConfig({ endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Section
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showViewAll"
                checked={formData.showViewAll}
                onChange={(e) => setFormData(prev => ({ ...prev, showViewAll: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showViewAll" className="text-sm font-medium text-gray-700">
                Show "View All" Button
              </label>
            </div>

            {formData.showViewAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View All Link
                </label>
                <input
                  type="text"
                  value={formData.viewAllLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, viewAllLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/products/category/graphics-cards"
                />
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedProducts.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : (section ? 'Update Section' : 'Create Section')}
          </button>
        </div>
      </form>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        selectedProducts={selectedProducts}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
};

export default ShowcaseSectionForm;