import React, { useState } from 'react';
import { ProductFormData, Specification } from '../../types/product';

interface SpecificationsSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const SpecificationsSection: React.FC<SpecificationsSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const [newSpecSection, setNewSpecSection] = useState({ sectionTitle: '', key: '', value: '' });
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const handleSpecChange = (sectionIndex: number, specIndex: number, field: string, value: string) => {
    const updatedSpecifications = [...formData.specifications];
    const updatedSpecs = [...updatedSpecifications[sectionIndex].specs];
    updatedSpecs[specIndex] = { ...updatedSpecs[specIndex], [field]: value };
    updatedSpecifications[sectionIndex].specs = updatedSpecs;
    updateFormData({ specifications: updatedSpecifications });
  };

  const handleSectionTitleChange = (sectionIndex: number, title: string) => {
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications[sectionIndex].sectionTitle = title;
    updateFormData({ specifications: updatedSpecifications });
  };

  const addSpecificationSection = () => {
    const newSection: Specification = {
      sectionTitle: '',
      specs: []
    };
    const updatedSpecifications = [...formData.specifications, newSection];
    updateFormData({ specifications: updatedSpecifications });
    setActiveSection(updatedSpecifications.length - 1);
  };

  const removeSpecificationSection = (sectionIndex: number) => {
    const updatedSpecifications = formData.specifications.filter((_, i) => i !== sectionIndex);
    updateFormData({ specifications: updatedSpecifications });
    if (activeSection === sectionIndex) {
      setActiveSection(null);
    } else if (activeSection && activeSection > sectionIndex) {
      setActiveSection(activeSection - 1);
    }
  };

  const addSpecToSection = (sectionIndex: number) => {
    if (!newSpecSection.key.trim() || !newSpecSection.value.trim()) return;

    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications[sectionIndex].specs.push({
      key: newSpecSection.key.trim(),
      value: newSpecSection.value.trim()
    });
    updateFormData({ specifications: updatedSpecifications });
    
    setNewSpecSection({ sectionTitle: '', key: '', value: '' });
  };

  const removeSpecFromSection = (sectionIndex: number, specIndex: number) => {
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications[sectionIndex].specs = updatedSpecifications[sectionIndex].specs.filter((_, i) => i !== specIndex);
    updateFormData({ specifications: updatedSpecifications });
  };

  const moveSpec = (sectionIndex: number, specIndex: number, direction: 'up' | 'down') => {
    const updatedSpecifications = [...formData.specifications];
    const specs = updatedSpecifications[sectionIndex].specs;
    
    if (direction === 'up' && specIndex > 0) {
      [specs[specIndex], specs[specIndex - 1]] = [specs[specIndex - 1], specs[specIndex]];
    } else if (direction === 'down' && specIndex < specs.length - 1) {
      [specs[specIndex], specs[specIndex + 1]] = [specs[specIndex + 1], specs[specIndex]];
    }
    
    updateFormData({ specifications: updatedSpecifications });
  };

  const duplicateSection = (sectionIndex: number) => {
    const sectionToDuplicate = formData.specifications[sectionIndex];
    const duplicatedSection: Specification = {
      sectionTitle: `${sectionToDuplicate.sectionTitle} (Copy)`,
      specs: sectionToDuplicate.specs.map(spec => ({ ...spec }))
    };
    
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications.splice(sectionIndex + 1, 0, duplicatedSection);
    updateFormData({ specifications: updatedSpecifications });
    setActiveSection(sectionIndex + 1);
  };

  const addQuickSpecs = (sectionIndex: number, specs: Array<{key: string, value: string}>) => {
    const updatedSpecifications = [...formData.specifications];
    updatedSpecifications[sectionIndex].specs.push(...specs);
    updateFormData({ specifications: updatedSpecifications });
  };

  const commonSpecTemplates = {
    'Technical': [
      { key: 'Model', value: '' },
      { key: 'Dimensions', value: '' },
      { key: 'Weight', value: '' },
      { key: 'Material', value: '' },
      { key: 'Color', value: '' }
    ],
    'Display': [
      { key: 'Screen Size', value: '' },
      { key: 'Resolution', value: '' },
      { key: 'Display Type', value: '' },
      { key: 'Refresh Rate', value: '' }
    ],
    'Performance': [
      { key: 'Processor', value: '' },
      { key: 'RAM', value: '' },
      { key: 'Storage', value: '' },
      { key: 'Battery', value: '' }
    ],
    'Connectivity': [
      { key: 'Wi-Fi', value: '' },
      { key: 'Bluetooth', value: '' },
      { key: 'Ports', value: '' },
      { key: 'Network', value: '' }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Specifications</h2>
        {isEditing && formData.specifications.length > 0 && (
          <div className="text-sm text-gray-500">
            {formData.specifications.reduce((total, section) => total + section.specs.length, 0)} total specifications
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
                {formData.specifications.length > 0 
                  ? 'Update existing specifications or add new ones. Use templates for quick setup.'
                  : 'No specifications yet. Add sections and specifications to provide detailed product information.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {formData.specifications.map((section, sectionIndex) => (
          <div 
            key={sectionIndex} 
            className={`border rounded-lg p-4 transition-all duration-200 ${
              activeSection === sectionIndex 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={section.sectionTitle}
                  onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Technical Specifications, Dimensions, Features"
                  required={!isEditing}
                />
              </div>
              <div className="ml-4 flex space-x-2">
                {isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={() => duplicateSection(sectionIndex)}
                      className="px-3 py-2 text-blue-600 hover:text-blue-700 text-sm border border-blue-300 rounded hover:bg-blue-50"
                      title="Duplicate Section"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection(activeSection === sectionIndex ? null : sectionIndex)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-700 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      title={activeSection === sectionIndex ? 'Collapse' : 'Expand'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeSection === sectionIndex ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeSpecificationSection(sectionIndex)}
                  className="px-3 py-2 text-red-600 hover:text-red-700 text-sm border border-red-300 rounded hover:bg-red-50"
                  title="Remove Section"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Templates - Only show when section is active or in create mode */}
            {(activeSection === sectionIndex || !isEditing) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(commonSpecTemplates).map(([name, specs]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addQuickSpecs(sectionIndex, specs)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Spec Form - Only show when section is active or in create mode */}
            {(activeSection === sectionIndex || !isEditing) && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <input
                    type="text"
                    value={newSpecSection.key}
                    onChange={(e) => setNewSpecSection(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Specification key (e.g., Weight)"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addSpecToSection(sectionIndex)}
                  />
                  <input
                    type="text"
                    value={newSpecSection.value}
                    onChange={(e) => setNewSpecSection(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Specification value (e.g., 1.5 kg)"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addSpecToSection(sectionIndex)}
                  />
                  <button
                    type="button"
                    onClick={() => addSpecToSection(sectionIndex)}
                    disabled={!newSpecSection.key.trim() || !newSpecSection.value.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Spec
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Press Enter to quickly add specifications
                </p>
              </div>
            )}

            {/* Specifications List */}
            <div className="space-y-2">
              {section.specs.map((spec, specIndex) => (
                <div key={specIndex} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg group hover:bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(sectionIndex, specIndex, 'key', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(sectionIndex, specIndex, 'value', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Value"
                    />
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing && section.specs.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveSpec(sectionIndex, specIndex, 'up')}
                          disabled={specIndex === 0}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSpec(sectionIndex, specIndex, 'down')}
                          disabled={specIndex === section.specs.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSpecFromSection(sectionIndex, specIndex)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {section.specs.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No specifications in this section</p>
                  <p className="text-xs text-gray-400 mt-1">Use the form above or quick templates to add specifications</p>
                </div>
              )}
            </div>

            {/* Section Summary */}
            {isEditing && section.specs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {section.specs.length} specification{section.specs.length !== 1 ? 's' : ''} in this section
                </p>
              </div>
            )}
          </div>
        ))}

        {formData.specifications.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Added</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isEditing 
                ? 'Add specifications to provide detailed information about your product. Use sections to organize different types of specifications.'
                : 'Specifications help customers understand your product better. Add sections for different categories like technical specs, dimensions, features, etc.'
              }
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={addSpecificationSection}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-700 hover:border-gray-400 bg-white transition-all duration-200 hover:bg-gray-50"
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Specification Section
          </div>
        </button>
      </div>
    </div>
  );
};

export default SpecificationsSection;