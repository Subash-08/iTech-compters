import React, { useState } from 'react';
import { ProductFormData, Feature } from '../../types/product';

interface FeaturesSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const [newFeature, setNewFeature] = useState({ title: '', description: '' });
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    updateFormData({ features: updatedFeatures });
  };

  const addFeature = () => {
    if (!newFeature.title.trim()) return;

    const feature: Feature = {
      title: newFeature.title.trim(),
      description: newFeature.description.trim()
    };

    updateFormData({
      features: [...formData.features, feature]
    });

    setNewFeature({ title: '', description: '' });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    updateFormData({ features: updatedFeatures });
    if (activeFeature === index) {
      setActiveFeature(null);
    } else if (activeFeature && activeFeature > index) {
      setActiveFeature(activeFeature - 1);
    }
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const updatedFeatures = [...formData.features];
    
    if (direction === 'up' && index > 0) {
      [updatedFeatures[index], updatedFeatures[index - 1]] = [updatedFeatures[index - 1], updatedFeatures[index]];
    } else if (direction === 'down' && index < updatedFeatures.length - 1) {
      [updatedFeatures[index], updatedFeatures[index + 1]] = [updatedFeatures[index + 1], updatedFeatures[index]];
    }
    
    updateFormData({ features: updatedFeatures });
  };

  const duplicateFeature = (index: number) => {
    const featureToDuplicate = formData.features[index];
    const duplicatedFeature: Feature = {
      title: `${featureToDuplicate.title} (Copy)`,
      description: featureToDuplicate.description
    };
    
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index + 1, 0, duplicatedFeature);
    updateFormData({ features: updatedFeatures });
    setActiveFeature(index + 1);
  };

  const addQuickFeatures = (features: Array<{title: string, description: string}>) => {
    const newFeatures = features.map(feature => ({
      title: feature.title,
      description: feature.description
    }));
    
    updateFormData({
      features: [...formData.features, ...newFeatures]
    });
  };

  const commonFeatureTemplates = {
    'Electronics': [
      { title: 'Fast Charging', description: 'Quick charging capability for convenience' },
      { title: 'Long Battery Life', description: 'Extended usage time on a single charge' },
      { title: 'High Resolution Display', description: 'Crisp and clear visual experience' }
    ],
    'Clothing': [
      { title: 'Breathable Fabric', description: 'Keeps you cool and comfortable' },
      { title: 'Moisture Wicking', description: 'Draws sweat away from the body' },
      { title: 'Durable Material', description: 'Long-lasting quality and wear resistance' }
    ],
    'Home Appliances': [
      { title: 'Energy Efficient', description: 'Saves on electricity costs' },
      { title: 'Quiet Operation', description: 'Minimal noise during use' },
      { title: 'Easy to Clean', description: 'Simple maintenance and cleaning' }
    ],
    'Smart Devices': [
      { title: 'Voice Control', description: 'Hands-free operation with voice commands' },
      { title: 'Mobile App', description: 'Control and monitor from your smartphone' },
      { title: 'Smart Home Integration', description: 'Works with popular smart home systems' }
    ]
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Product Features</h2>
        {isEditing && formData.features.length > 0 && (
          <div className="text-sm text-gray-500">
            {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-blue-800">Edit Mode</span>
              <p className="text-sm text-blue-700 mt-1">
                {formData.features.length > 0 
                  ? 'Update existing features or add new ones. Reorder features to highlight the most important ones first.'
                  : 'No features added yet. Features help customers understand what makes your product special.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Templates */}
      {(!isEditing || formData.features.length === 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Quick Feature Templates</h3>
          <p className="text-sm text-green-700 mb-3">
            Start with pre-defined feature templates for common product categories:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(commonFeatureTemplates).map(([category, features]) => (
              <button
                key={category}
                type="button"
                onClick={() => addQuickFeatures(features)}
                className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg border border-green-300 hover:bg-green-200 transition-colors"
              >
                + {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add New Feature Form */}
      <div className={`bg-gray-50 p-4 rounded-lg border-2 ${isEditing ? 'border-blue-200' : 'border-gray-200'}`}>
        <h3 className="text-md font-medium text-gray-900 mb-3">
          {isEditing ? 'Add New Feature' : 'Add Feature'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feature Title {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={newFeature.title}
              onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Fast Charging, Water Resistant, Energy Efficient"
              required={!isEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description {!isEditing && '(Recommended)'}
            </label>
            <textarea
              value={newFeature.description}
              onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
              onKeyPress={handleKeyPress}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe this feature in detail. Explain how it benefits the customer..."
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={addFeature}
              disabled={!newFeature.title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Feature
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setNewFeature({ title: '', description: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {!isEditing && (
            <p className="text-xs text-gray-500">
              Press Enter to quickly add features
            </p>
          )}
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900">
            Features List {formData.features.length > 0 && `(${formData.features.length})`}
          </h3>
          {isEditing && formData.features.length > 1 && (
            <p className="text-sm text-gray-500">
              Drag or use arrows to reorder
            </p>
          )}
        </div>
        
        {formData.features.map((feature, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 transition-all duration-200 group ${
              activeFeature === index 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            draggable={isEditing}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', index.toString());
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
              const updatedFeatures = [...formData.features];
              const [movedFeature] = updatedFeatures.splice(fromIndex, 1);
              updatedFeatures.splice(index, 0, movedFeature);
              updateFormData({ features: updatedFeatures });
            }}
          >
            <div className="flex items-start space-x-3">
              {/* Reorder Controls */}
              {isEditing && formData.features.length > 1 && (
                <div className="flex flex-col space-y-1 pt-2">
                  <button
                    type="button"
                    onClick={() => moveFeature(index, 'up')}
                    disabled={index === 0}
                    className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeature(index, 'down')}
                    disabled={index === formData.features.length - 1}
                    className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Feature Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isEditing ? 'text-sm font-medium bg-white' : 'text-base font-semibold'
                    }`}
                    placeholder="Feature title"
                  />
                  <div className="ml-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => duplicateFeature(index)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Duplicate Feature"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFeature(activeFeature === index ? null : index)}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                          title={activeFeature === index ? 'Collapse' : 'Expand'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeFeature === index ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove Feature"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {(activeFeature === index || !isEditing || feature.description) && (
                  <textarea
                    value={feature.description}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Describe this feature and how it benefits customers..."
                  />
                )}
              </div>
            </div>
            
            {/* Feature Preview (Edit Mode) */}
            {isEditing && feature.description && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Preview:</p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            )}
          </div>
        ))}

        {formData.features.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Added</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              {isEditing 
                ? 'Features help highlight what makes your product special. Add key features that customers care about most.'
                : 'Start by adding your product\'s key features. Focus on benefits that matter to customers.'
              }
            </p>
            {!isEditing && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Quick tips:</p>
                <ul className="text-sm text-gray-500 text-left max-w-sm mx-auto space-y-1">
                  <li>• Focus on customer benefits, not just specifications</li>
                  <li>• Keep titles clear and descriptive</li>
                  <li>• Use descriptions to explain how features help customers</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features Summary */}
      {isEditing && formData.features.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Features Summary</span>
              <p className="text-sm text-gray-600 mt-1">
                You have {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}. 
                The most important features should be at the top.
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {formData.features.filter(f => f.description.trim()).length}/{formData.features.length} with descriptions
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesSection;