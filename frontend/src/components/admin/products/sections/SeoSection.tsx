import React, { useState, useEffect } from 'react';
import { ProductFormData } from '../../types/product';

interface SeoSectionProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  isEditing?: boolean;
}

const SeoSection: React.FC<SeoSectionProps> = ({
  formData,
  updateFormData,
  isEditing = false
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    meta: { ...formData.meta },
    canonicalUrl: formData.canonicalUrl,
    notes: formData.notes
  });

  // Store original values when component mounts in edit mode
  useEffect(() => {
    if (isEditing) {
      setOriginalValues({
        meta: { ...formData.meta },
        canonicalUrl: formData.canonicalUrl,
        notes: formData.notes
      });
    }
  }, [isEditing]);

  // Calculate SEO score
  useEffect(() => {
    calculateSeoScore();
  }, [formData.meta, formData.name, formData.description]);

  const handleMetaChange = (field: string, value: any) => {
    updateFormData({
      meta: {
        ...formData.meta,
        [field]: value
      }
    });
  };

  const handleCanonicalUrlChange = (value: string) => {
    updateFormData({ canonicalUrl: value });
  };

  const handleNotesChange = (value: string) => {
    updateFormData({ notes: value });
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;

    const keyword = newKeyword.trim().toLowerCase();
    const updatedKeywords = [...formData.meta.keywords];
    
    // Avoid duplicates
    if (!updatedKeywords.includes(keyword)) {
      updatedKeywords.push(keyword);
      handleMetaChange('keywords', updatedKeywords);
    }
    
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = formData.meta.keywords.filter((_, i) => i !== index);
    handleMetaChange('keywords', updatedKeywords);
  };

  const generateMetaDescription = () => {
    // Auto-generate meta description from product description
    const description = formData.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .slice(0, 155) // Leave room for ellipsis
      .trim();
    
    const finalDescription = description.length === 155 ? `${description}...` : description;
    handleMetaChange('description', finalDescription);
  };

  const generateMetaTitle = () => {
    // Auto-generate meta title from product name and brand
    const baseTitle = formData.name;
    const brand = typeof formData.brand === 'string' ? formData.brand : 'Our Store';
    const title = `${baseTitle} | ${brand}`.slice(0, 60);
    handleMetaChange('title', title);
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateSeoScore = () => {
    let score = 0;
    const maxScore = 100;

    // Meta title (25 points)
    if (formData.meta.title) {
      const titleLength = formData.meta.title.length;
      if (titleLength >= 50 && titleLength <= 60) score += 25;
      else if (titleLength >= 40 && titleLength <= 70) score += 20;
      else if (titleLength > 0) score += 10;
    }

    // Meta description (25 points)
    if (formData.meta.description) {
      const descLength = formData.meta.description.length;
      if (descLength >= 150 && descLength <= 160) score += 25;
      else if (descLength >= 120 && descLength <= 180) score += 20;
      else if (descLength > 0) score += 10;
    }

    // Keywords (20 points)
    if (formData.meta.keywords.length >= 3) score += 20;
    else if (formData.meta.keywords.length > 0) score += 10;

    // Product name and description (30 points)
    if (formData.name && formData.name.length > 10) score += 15;
    if (formData.description && formData.description.length > 100) score += 15;

    setSeoScore(score);
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeoRecommendations = () => {
    const recommendations = [];

    if (!formData.meta.title) {
      recommendations.push('Add a meta title for better SEO');
    } else if (formData.meta.title.length < 50) {
      recommendations.push('Meta title is too short (aim for 50-60 characters)');
    } else if (formData.meta.title.length > 60) {
      recommendations.push('Meta title is too long (aim for 50-60 characters)');
    }

    if (!formData.meta.description) {
      recommendations.push('Add a meta description for better click-through rates');
    } else if (formData.meta.description.length < 120) {
      recommendations.push('Meta description could be more descriptive');
    }

    if (formData.meta.keywords.length < 3) {
      recommendations.push('Add more keywords (3-5 recommended)');
    }

    if (!formData.name || formData.name.length < 10) {
      recommendations.push('Product name should be descriptive and clear');
    }

    return recommendations;
  };

  const resetToOriginal = () => {
    updateFormData({
      meta: { ...originalValues.meta },
      canonicalUrl: originalValues.canonicalUrl,
      notes: originalValues.notes
    });
  };

  const hasChanges = () => {
    return (
      formData.meta.title !== originalValues.meta.title ||
      formData.meta.description !== originalValues.meta.description ||
      JSON.stringify(formData.meta.keywords) !== JSON.stringify(originalValues.meta.keywords) ||
      formData.canonicalUrl !== originalValues.canonicalUrl ||
      formData.notes !== originalValues.notes
    );
  };

  const commonKeywordSuggestions = [
    'affordable',
    'best quality',
    'buy online',
    'cheap',
    'discount',
    'free shipping',
    'latest model',
    'premium',
    'sale',
    'top rated'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">SEO & Additional Information</h2>
        {isEditing && hasChanges() && (
          <button
            type="button"
            onClick={resetToOriginal}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Reset Changes
          </button>
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
                {hasChanges() 
                  ? 'You have unsaved SEO changes. Update meta information to improve search visibility.'
                  : 'Optimize your product SEO to improve search rankings and click-through rates.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEO Score Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">SEO Score</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeoScoreColor(seoScore)}`}>
            {seoScore}/100
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              seoScore >= 80 ? 'bg-green-500' :
              seoScore >= 60 ? 'bg-yellow-500' :
              seoScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${seoScore}%` }}
          ></div>
        </div>

        {getSeoRecommendations().length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {getSeoRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Meta Title */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Meta Title {!isEditing && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${
              formData.meta.title.length >= 50 && formData.meta.title.length <= 60 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formData.meta.title.length}/60
            </span>
            <button
              type="button"
              onClick={generateMetaTitle}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Auto-generate
            </button>
          </div>
        </div>
        <input
          type="text"
          value={formData.meta.title}
          onChange={(e) => handleMetaChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Meta title for SEO (50-60 characters recommended)"
          maxLength={60}
          required={!isEditing}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Recommended: 50-60 characters for optimal search display</span>
          <span className={formData.meta.title.length > 60 ? 'text-red-600' : ''}>
            {60 - formData.meta.title.length} characters left
          </span>
        </div>
      </div>

      {/* Meta Description */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Meta Description {!isEditing && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${
              formData.meta.description.length >= 150 && formData.meta.description.length <= 160 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formData.meta.description.length}/160
            </span>
            <button
              type="button"
              onClick={generateMetaDescription}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Auto-generate
            </button>
          </div>
        </div>
        <textarea
          value={formData.meta.description}
          onChange={(e) => handleMetaChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Meta description for SEO (150-160 characters recommended)"
          maxLength={160}
          required={!isEditing}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Recommended: 150-160 characters for optimal search display</span>
          <span className={formData.meta.description.length > 160 ? 'text-red-600' : ''}>
            {160 - formData.meta.description.length} characters left
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Keywords {!isEditing && '(Recommended)'}
          </label>
          <span className="text-xs text-gray-500">
            {formData.meta.keywords.length} added
          </span>
        </div>
        
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a keyword and press Enter"
          />
          <button
            type="button"
            onClick={addKeyword}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Keyword Suggestions */}
        {(!isEditing || formData.meta.keywords.length < 3) && (
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-2">Common Suggestions:</label>
            <div className="flex flex-wrap gap-1">
              {commonKeywordSuggestions.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => {
                    setNewKeyword(keyword);
                    addKeyword();
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200"
                >
                  + {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Keywords List */}
        <div className="flex flex-wrap gap-2 min-h-8">
          {formData.meta.keywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="ml-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove keyword"
              >
                ×
              </button>
            </span>
          ))}
          
          {formData.meta.keywords.length === 0 && (
            <span className="text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Add keywords to improve search visibility
            </span>
          )}
        </div>
      </div>

      {/* Advanced SEO Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-md font-medium text-gray-900">Advanced SEO Options</h3>
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Canonical URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canonical URL
              </label>
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) => handleCanonicalUrlChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/canonical-product-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use this if this product page is a duplicate of another page to avoid SEO penalties
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any internal notes about this product, SEO strategy, or marketing plans..."
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes are for internal use only and won't be displayed to customers
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SEO Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Search Result Preview</h3>
        <div className="space-y-2 bg-white p-3 rounded border">
          <div className="text-blue-600 text-lg font-medium truncate">
            {formData.meta.title || 'Example: Product Name | Brand Name'}
          </div>
          <div className="text-green-600 text-sm">
            https://yourstore.com/products/{generateSlug(formData.name || 'product-name')}
          </div>
          <div className="text-gray-600 text-sm leading-relaxed">
            {formData.meta.description || 'Product description will appear here in search results. Make it compelling to improve click-through rates.'}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This is how your product might appear in search engine results
        </p>
      </div>

      {/* Current Values Summary for Edit Mode */}
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Current SEO Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Meta Title:</span>
              <div className="font-medium truncate">
                {formData.meta.title || 'Not set'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Keywords:</span>
              <div className="font-medium">
                {formData.meta.keywords.length} keywords
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoSection;