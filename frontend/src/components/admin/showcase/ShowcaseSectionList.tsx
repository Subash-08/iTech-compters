// src/components/admin/showcase/ShowcaseSectionList.tsx
import React, { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Grid, SlidersHorizontal, Clock, Package } from 'lucide-react';
import { ShowcaseSection } from '../types/showcaseSection';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

interface ShowcaseSectionListProps {
  sections: ShowcaseSection[];
  loading: boolean;
  onEdit: (section: ShowcaseSection) => void;
  onDelete: (section: ShowcaseSection) => void;
  onToggleStatus: (section: ShowcaseSection) => void;
}

const ShowcaseSectionList: React.FC<ShowcaseSectionListProps> = ({
  sections,
  loading,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleExpand = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getTimerStatus = (section: ShowcaseSection) => {
    if (!section.timerConfig.hasTimer) {
      return { status: 'No Timer', color: 'gray' };
    }
    
    if (section.timerStatus === 'expired') {
      return { status: 'Expired', color: 'red' };
    }
    
    return { status: 'Active', color: 'green' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No showcase sections found</h3>
        <p className="text-gray-600">Create your first showcase section to display products.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const timerStatus = getTimerStatus(section);
        
        return (
          <div
            key={section._id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            {/* Section Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {section.title}
                    </h3>
                    <StatusBadge
                      status={section.isActive ? 'active' : 'inactive'}
                      text={section.isActive ? 'Active' : 'Inactive'}
                    />
                    <StatusBadge
                      status={timerStatus.color as any}
                      text={timerStatus.status}
                    />
                  </div>
                  
                  {section.subtitle && (
                    <p className="text-gray-600 mb-3">{section.subtitle}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {section.type === 'grid' ? (
                        <Grid className="w-4 h-4" />
                      ) : (
                        <SlidersHorizontal className="w-4 h-4" />
                      )}
                      <span className="capitalize">{section.type} Layout</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{section.products.length} products</span>
                    </div>
                    
                    {section.timerConfig.hasTimer && section.timerConfig.endDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Ends: {new Date(section.timerConfig.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      Order: {section.displayOrder}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onToggleStatus(section)}
                    className={`p-2 rounded-lg transition-colors ${
                      section.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title={section.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {section.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => onEdit(section)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDelete(section)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Analytics */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{section.meta.impressions}</span> impressions
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{section.meta.clicks}</span> clicks
                </div>
                <div className="text-gray-600">
                  Created: {new Date(section.meta.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Expandable Products Preview */}
            <div className="border-t">
              <button
                onClick={() => toggleExpand(section._id)}
                className="w-full px-6 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {expandedSection === section._id ? 'Hide' : 'Show'} Products ({section.products.length})
              </button>
              
              {expandedSection === section._id && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.products.slice(0, 6).map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
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
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            R{product.offerPrice || product.basePrice}
                          </p>
                        </div>
                        <StatusBadge
                          status={product.stockQuantity > 0 ? 'active' : 'inactive'}
                          text={product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                          small
                        />
                      </div>
                    ))}
                  </div>
                  {section.products.length > 6 && (
                    <p className="text-sm text-gray-600 mt-3">
                      +{section.products.length - 6} more products
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShowcaseSectionList;