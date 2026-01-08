// src/components/admin/prebuilt-pcs/PreBuiltPCForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Loader, 
  Plus, 
  Trash2, 
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
import { preBuiltPCService, type Component, type PreBuiltPCFormData } from '../services/preBuiltPCService';
import PreBuiltPCBenchmarks from './PreBuiltPCBenchmarks';
import { baseURL } from '../../config/config';

const PreBuiltPCForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPC, setCurrentPC] = useState<any>(null);

  // Check if this is a new PC
  const isNewPC = !id || id === 'new';  

  // Base URL for images
  const baseURL_Image =  `${baseURL}/api/v1`;

 const getImageUrl = (url: any): string => {
    // Handle null, undefined, or non-string values
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Already full URL (e.g., Cloudinary)
    if (url.startsWith('http')) {
      return url;
    }

    // Serve relative to backend (same server)
    const baseUrl =  baseURL; 

    // Remove leading slash if present to avoid double slashes
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    return `${baseUrl}/${cleanUrl}`;
  };

const [formData, setFormData] = useState<PreBuiltPCFormData>({
  name: '',
  category: '',
  description: '',
  shortDescription: '',
  tags: '',
  components: [
    { partType: 'CPU', name: '', brand: '', specs: '' },
    { partType: 'Motherboard', name: '', brand: '', specs: '' },
    { partType: 'RAM', name: '', brand: '', specs: '' },
    { partType: 'Storage', name: '', brand: '', specs: '' },
    { partType: 'Cabinet', name: '', brand: '', specs: '' },
    { partType: 'GPU', name: '', brand: '', specs: '' },
    { partType: 'PSU', name: '', brand: '', specs: '' },
  ],
  // Pricing fields
  basePrice: 0,
  offerPrice: 0,
  discountPercentage: 0,
  condition: 'New',
  // Stock fields
  stockQuantity: 0,
  // Other fields
  warranty: '1 Year',
  performanceRating: 5,
  featured: false,
  averageRating: 0,
  totalReviews: 0
});

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [componentImages, setComponentImages] = useState<{ [key: number]: File }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = ['Gaming', 'Office', 'Editing', 'Budget', 'Workstation', 'Streaming'];

  useEffect(() => {
    if (id && !isNewPC) {
      loadPreBuiltPC();
    }
  }, [id]);

const loadPreBuiltPC = async () => {
  if (!id || isNewPC) return;

  try {
    setLoading(true);
    const response = await preBuiltPCService.getPreBuiltPC(id);
    setCurrentPC(response.data);
    const pc = response.data;
    
    setFormData({
      name: pc.name || '',
      category: pc.category || '',
      description: pc.description || '',
      shortDescription: pc.shortDescription || '',
      tags: pc.tags?.join(', ') || '',
      components: pc.components || formData.components,
      totalPrice: pc.totalPrice || 0,
      discountPrice: pc.discountPrice || 0,
      stockQuantity: pc.stockQuantity || 0,
      warranty: pc.warranty || '1 Year',
      performanceRating: pc.performanceRating || 5,
      featured: pc.featured || false,
      
      // ✅ ADD THESE NEW FIELDS
      basePrice: pc.basePrice || pc.totalPrice || 0,
      offerPrice: pc.offerPrice || pc.discountPrice || pc.totalPrice || 0,
      averageRating: pc.averageRating || 0,
      totalReviews: pc.totalReviews || 0,
      condition: pc.condition || 'New'
    });
    
    // Set existing images from database
    setExistingImages(pc.images || []);
    
  } catch (error) {
    toast.error('Failed to load pre-built PC');
    console.error('Error loading pre-built PC:', error);
  } finally {
    setLoading(false);
  }
};

// Add this function inside your component
const calculateDiscountPercentage = () => {
  if (formData.basePrice > 0 && formData.offerPrice > 0 && formData.offerPrice < formData.basePrice) {
    const discountPercentage = Math.round(((formData.basePrice - formData.offerPrice) / formData.basePrice) * 100);
    setFormData(prev => ({ ...prev, discountPercentage }));
  } else {
    setFormData(prev => ({ ...prev, discountPercentage: 0 }));
  }
};

// Update the handleInputChange to recalculate discount
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target;
  const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                   type === 'number' ? parseFloat(value) || 0 : value;
  
  setFormData(prev => ({
    ...prev,
    [name]: newValue
  }));

  // Recalculate discount when basePrice or offerPrice changes
  if (name === 'basePrice' || name === 'offerPrice') {
    setTimeout(calculateDiscountPercentage, 100);
  }
};

  const handleComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, components: updatedComponents }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { partType: '', name: '', brand: '', specs: '' }]
    }));
  };

  const removeComponent = (index: number) => {
    if (formData.components.length > 7) {
      setFormData(prev => ({
        ...prev,
        components: prev.components.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleComponentImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComponentImages(prev => ({
        ...prev,
        [index]: e.target.files![0]
      }));
    }
  };

  const removeComponentImage = (index: number) => {
    setComponentImages(prev => {
      const newImages = { ...prev };
      delete newImages[index];
      return newImages;
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.totalPrice <= 0) newErrors.totalPrice = 'Total price must be greater than 0';
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative';

    // Validate required components
    const requiredParts = ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Cabinet'];
    requiredParts.forEach(part => {
      const component = formData.components.find(comp => comp.partType === part);
      if (!component?.name?.trim() || !component?.brand?.trim() || !component?.specs?.trim()) {
        newErrors.components = `Please fill all fields for ${part}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeExistingImage = (index: number) => {
    // Store the removed image for backend processing
    const removedImage = existingImages[index];
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to get component image URL
  const getComponentImageUrl = (component: any): string => {
    if (!component) return '';
    if (component.image?.url) {
      const url = getImageUrl(component.image.url);
      return url;
    } else if (component.imageUrl) {
      const url = getImageUrl(component.imageUrl);
      return url;
    } else if (component.image) {
      // If image is a string directly
      const url = getImageUrl(component.image);
      return url;
    }
    return '';
  };
// In PreBuiltPCForm.tsx - FIX handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Please fix the form errors before submitting');
    return;
  }

  try {
    setSaving(true);
    const formDataToSend = new FormData();
    
    // Basic information
    formDataToSend.append('name', formData.name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('shortDescription', formData.shortDescription || '');
    
    // Handle tags as array
    const tagsArray = typeof formData.tags === 'string' 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : formData.tags || [];
    formDataToSend.append('tags', JSON.stringify(tagsArray));
    
    // Handle components as array
    formDataToSend.append('components', JSON.stringify(formData.components));
    
    // ✅ FIX: Ensure all numeric fields have values
    formDataToSend.append('basePrice', (formData.basePrice || 0).toString());
    formDataToSend.append('offerPrice', (formData.offerPrice || 0).toString());
    formDataToSend.append('discountPercentage', (formData.discountPercentage || 0).toString());
    
    // ✅ ALSO SEND OLD FIELDS FOR BACKWARD COMPATIBILITY
    formDataToSend.append('totalPrice', (formData.basePrice || 0).toString());
    formDataToSend.append('discountPrice', (formData.offerPrice || 0).toString());
    
    // ✅ OTHER FIELDS WITH DEFAULT VALUES
    formDataToSend.append('stockQuantity', (formData.stockQuantity || 0).toString());
    formDataToSend.append('performanceRating', (formData.performanceRating || 5).toString());
    formDataToSend.append('warranty', formData.warranty || '1 Year');
    formDataToSend.append('featured', (formData.featured || false).toString());
    formDataToSend.append('condition', formData.condition || 'New');
    formDataToSend.append('averageRating', (formData.averageRating || 0).toString());
    formDataToSend.append('totalReviews', (formData.totalReviews || 0).toString());

    // Handle images
    images.forEach((image, index) => {
      formDataToSend.append('images', image);
    });

    // Handle component images
    Object.entries(componentImages).forEach(([index, file]) => {
      formDataToSend.append('componentImages', file);
      formDataToSend.append('componentImageIndexes', index);
    });

    if (!isNewPC && existingImages.length > 0) {
      formDataToSend.append('existingImages', JSON.stringify(existingImages));
    }
    if (!isNewPC && id) {
      await preBuiltPCService.updatePreBuiltPC(id, formDataToSend);
      toast.success('Pre-built PC updated successfully');
    } else {
      await preBuiltPCService.createPreBuiltPC(formDataToSend);
      toast.success('Pre-built PC created successfully');
    }
    
    navigate('/admin/prebuilt-pcs');
  } catch (error: any) {
    console.error('Form submission error:', error);
    
    // FIX: Handle the toString error with proper error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to save pre-built PC';
    toast.error(errorMessage);
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading PC data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewPC ? 'Create Pre-built PC' : 'Edit Pre-built PC'}
            </h1>
            <p className="text-gray-600">
              {isNewPC 
                ? 'Add a new pre-built computer configuration' 
                : `Update "${formData.name}" configuration`
              }
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/prebuilt-pcs')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to List</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PC Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Gaming Beast X7"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description (max 500 characters)"
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the PC..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., RTX 4070, Ryzen 7, 32GB RAM (comma separated)"
              />
              <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
            </div>
          </div>
        </div>

{/* Pricing & Stock */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Base Price */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Base Price (Rs) <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-500">Rs</span>
        <input
          type="number"
          name="basePrice"
          value={formData.basePrice}
          onChange={handleInputChange}
          className={`w-full pl-12 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.basePrice ? 'border-red-500' : 'border-gray-300'
          }`}
          min="0"
          step="0.01"
          required
        />
      </div>
      {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
    </div>

    {/* Offer Price */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Offer Price (Rs)
      </label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-500">Rs</span>
        <input
          type="number"
          name="offerPrice"
          value={formData.offerPrice}
          onChange={handleInputChange}
          className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>
    </div>

    {/* Discount Percentage */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Discount Percentage (%)
      </label>
      <input
        type="number"
        name="discountPercentage"
        value={formData.discountPercentage}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        min="0"
        max="100"
        readOnly
      />
      <p className="text-xs text-gray-500 mt-1">
        Calculated automatically from prices
      </p>
    </div>

    {/* Condition */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Condition <span className="text-red-500">*</span>
      </label>
      <select
        name="condition"
        value={formData.condition}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="New">New</option>
        <option value="Refurbished">Refurbished</option>
        <option value="Used">Used</option>
      </select>
    </div>

    {/* Stock Quantity */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Stock Quantity <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        name="stockQuantity"
        value={formData.stockQuantity}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
        }`}
        min="0"
        required
      />
      {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
    </div>

    {/* Warranty */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Warranty
      </label>
      <input
        type="text"
        name="warranty"
        value={formData.warranty}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., 1 Year"
      />
    </div>

    {/* Performance Rating */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Performance Rating
      </label>
      <select
        name="performanceRating"
        value={formData.performanceRating}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
          <option key={rating} value={rating}>{rating}/10</option>
        ))}
      </select>
    </div>

    {/* Featured Checkbox */}
    <div className="flex items-center">
      <input
        type="checkbox"
        name="featured"
        checked={formData.featured}
        onChange={handleInputChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label className="ml-2 block text-sm text-gray-900">
        Featured Product
      </label>
    </div>
  </div>

  {/* Pricing Summary */}
  {(formData.offerPrice > 0 && formData.offerPrice < formData.basePrice) && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Pricing Summary</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Original Price:</span>
          <div className="font-medium">Rs {formData.basePrice.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-600">Sale Price:</span>
          <div className="font-medium text-green-600">Rs {formData.offerPrice.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-600">You Save:</span>
          <div className="font-medium text-red-600">
            Rs {(formData.basePrice - formData.offerPrice).toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Discount:</span>
          <div className="font-medium text-red-600">
            {formData.discountPercentage}%
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Stock Status */}
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-gray-800">Stock Status</span>
        <p className="text-sm text-gray-600 mt-1">
          Current stock level: <strong>{formData.stockQuantity || 0}</strong> units
        </p>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          (formData.stockQuantity || 0) > 10 
            ? 'bg-green-100 text-green-800' 
            : (formData.stockQuantity || 0) > 0 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          { (formData.stockQuantity || 0) > 10 ? 'In Stock' : 
            (formData.stockQuantity || 0) > 0 ? 'Low Stock' : 'Out of Stock' }
        </span>
      </div>
    </div>
  </div>
</div>

        {/* Component List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Components</h2>
            <span className="text-sm text-gray-500">
              {formData.components.length} components
            </span>
          </div>
          
          {errors.components && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{errors.components}</p>
            </div>
          )}

          <div className="space-y-4">
            {formData.components.map((component, index) => {
              const componentImageUrl = getComponentImageUrl(component);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">
                      {component.partType || 'Custom Component'}
                    </h3>
                    {index >= 7 && (
                      <button
                        type="button"
                        onClick={() => removeComponent(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Part Type
                      </label>
                      <input
                        type="text"
                        value={component.partType}
                        onChange={(e) => handleComponentChange(index, 'partType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., CPU, GPU, RAM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={component.name}
                        onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Intel Core i7-13700K"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={component.brand}
                        onChange={(e) => handleComponentChange(index, 'brand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Intel, NVIDIA, Corsair"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specifications
                      </label>
                      <textarea
                        value={component.specs}
                        onChange={(e) => handleComponentChange(index, 'specs', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 16 cores, 5.4GHz, 30MB Cache"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Component Image
                      </label>
                      <div className="flex items-center space-x-4">
                        {componentImages[index] ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={URL.createObjectURL(componentImages[index])}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeComponentImage(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : componentImageUrl ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={componentImageUrl}
                              alt={component.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.src = 'https://placehold.co/64x64?text=No+Image';
                              }}
                            />
                            <span className="text-sm text-gray-500">Current</span>
                          </div>
                        ) : null}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleComponentImageUpload(index, e)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      {/* Debug info - remove in production */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-1 text-xs text-gray-500">
                          Image URL: {componentImageUrl || 'No image'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addComponent}
            className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Component</span>
          </button>
        </div>

        {/* Performance Benchmarks - Only show for existing PCs */}
        {!isNewPC && id && (
          <PreBuiltPCBenchmarks 
            pcId={id}
            currentPC={currentPC}
          />
        )}

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">PC Images</h2>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Current Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="relative">
                    <img
                      src={getImageUrl(image.url)}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">New Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={`new-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-2">
              Upload up to 5 images. First image will be used as the main display image.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/prebuilt-pcs')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            <span>{isNewPC ? 'Create PC' : 'Update PC'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreBuiltPCForm;