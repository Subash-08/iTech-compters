// src/components/admin/hero/SlideForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { heroSectionService, HeroSection, Video } from '../services/heroSectionService';
import { getImageUrl } from '../../utils/imageUtils';
import { videoService } from '../services/videoService';

// Safe icon fallbacks
const SafeIcons = {
  Loader: ({ className }: { className?: string }) => (
    <div className={className}>⏳</div>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div className={className}>←</div>
  ),
  Image: ({ className }: { className?: string }) => (
    <div className={className}>🖼️</div>
  ),
  Video: ({ className }: { className?: string }) => (
    <div className={className}>🎬</div>
  ),
  Search: ({ className }: { className?: string }) => (
    <div className={className}>🔍</div>
  ),
};

interface SlideFormData {
  title: string;
  subtitle?: string;
  description?: string;
  mediaType: 'image' | 'video';
  videoId?: string;
  videoSettings?: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    playsInline: boolean;
  };
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

const SlideForm: React.FC = () => {
  const { id, slideId } = useParams<{ id: string; slideId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(slideId);

  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState<SlideFormData>({
    title: '',
    subtitle: '',
    description: '',
    mediaType: 'image',
    videoId: '',
    videoSettings: {
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      playsInline: true,
    },
    buttonText: '',
    buttonLink: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageError = (videoId: string) => {
    setImageErrors(prev => ({ ...prev, [videoId]: true }));
  };

  const isImageError = (videoId: string) => {
    return imageErrors[videoId] || false;
  };

  useEffect(() => {
    if (id) {
      loadHeroSection();
      if (formData.mediaType === 'video') {
        loadAvailableVideos();
      }
    }
  }, [id, formData.mediaType]);

  useEffect(() => {
    if (isEdit && slideId && heroSection) {
      const slide = heroSection.slides.find(s => s._id === slideId);
      if (slide) {
        setFormData({
          title: slide.title,
          subtitle: slide.subtitle || '',
          description: slide.description || '',
          mediaType: slide.mediaType || 'image',
          videoId: slide.videoId || '',
          videoSettings: slide.videoSettings || {
            autoplay: true,
            loop: true,
            muted: true,
            controls: false,
            playsInline: true,
          },
          buttonText: slide.buttonText || '',
          buttonLink: slide.buttonLink || '',
          backgroundColor: slide.backgroundColor || '#ffffff',
          textColor: slide.textColor || '#000000',
          isActive: slide.isActive,
          order: slide.order,
          startDate: slide.startDate ? new Date(slide.startDate).toISOString().split('T')[0] : '',
          endDate: slide.endDate ? new Date(slide.endDate).toISOString().split('T')[0] : '',
        });
        
        if (slide.mediaType === 'image') {
          setImagePreview(slide.image);
        }
        
        // If it's a video slide, load the selected video details
        if (slide.mediaType === 'video' && slide.videoId) {
          loadVideoDetails(slide.videoId);
        }
      }
    } else if (!isEdit && heroSection) {
      // Set default order to last position for new slides
      setFormData(prev => ({
        ...prev,
        order: heroSection.slides.length,
      }));
    }
  }, [isEdit, slideId, heroSection]);

  const loadHeroSection = async () => {
    try {
      const response = await heroSectionService.getHeroSectionById(id!);
      if (response.success) {
        setHeroSection(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hero section');
    }
  };

  const loadAvailableVideos = useCallback(async () => {
    try {
      setLoadingVideos(true);
      const response = await heroSectionService.getAvailableVideos(videoSearch);
      if (response.success) {
        setAvailableVideos(response.data.videos || []);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  }, [videoSearch]);

  const loadVideoDetails = async (videoId: string) => {
    try {
      const response = await videoService.getVideoById(videoId);
      if (response.success) {
        // Add video to available videos list if not already there
        setAvailableVideos(prev => {
          const exists = prev.some(v => v._id === videoId);
          if (!exists && response.data) {
            return [response.data, ...prev];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load video details:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    setFormData(prev => ({
      ...prev,
      mediaType: type,
      videoId: type === 'image' ? '' : prev.videoId
    }));
    
    if (type === 'video') {
      loadAvailableVideos();
    }
  };

  const handleVideoSelect = (video: Video) => {
    setFormData(prev => ({
      ...prev,
      videoId: video._id,
      videoSettings: {
        ...prev.videoSettings,
        autoplay: true,
        loop: true,
        muted: true,
        controls: false,
        playsInline: true,
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (formData.mediaType === 'image' && !imageFile && !imagePreview && !isEdit) {
      setError('Image is required for image slides');
      return;
    }
    
    if (formData.mediaType === 'video' && !formData.videoId) {
      setError('Please select a video');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof SlideFormData];
        if (value !== undefined && value !== null) {
          if (key === 'videoSettings') {
            const settings = value as any;
            Object.keys(settings).forEach(settingKey => {
              formDataToSend.append(`videoSettings[${settingKey}]`, settings[settingKey].toString());
            });
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // Append image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (isEdit) {
        await heroSectionService.updateSlide(id!, slideId!, formDataToSend);
      } else {
        await heroSectionService.addSlide(id!, formDataToSend);
      }
      
      navigate(`/admin/hero-sections/${id}/slides`);
    } catch (err: any) {
      setError(err.message || 'Failed to save slide');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SlideFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVideoSettingChange = (setting: keyof NonNullable<SlideFormData['videoSettings']>, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      videoSettings: {
        ...prev.videoSettings!,
        [setting]: value
      }
    }));
  };

  if (!heroSection) {
    return (
      <div className="flex justify-center items-center py-12">
        <SafeIcons.Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/admin/hero-sections/${id}/slides`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <SafeIcons.ArrowLeft className="w-4 h-4" />
          <span>Back to Slides</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Slide' : 'Add New Slide'}
        </h1>
        <p className="text-gray-600">
          {isEdit ? 'Update your slide content and settings' : 'Create a new slide for your hero section'}
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
        {/* Media Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Media Type</h3>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleMediaTypeChange('image')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.mediaType === 'image' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <SafeIcons.Image className={`w-8 h-8 mb-2 ${
                formData.mediaType === 'image' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                formData.mediaType === 'image' ? 'text-blue-700' : 'text-gray-700'
              }`}>
                Image
              </span>
              <span className="text-sm text-gray-500 mt-1">Upload an image</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleMediaTypeChange('video')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.mediaType === 'video' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <SafeIcons.Video className={`w-8 h-8 mb-2 ${
                formData.mediaType === 'video' ? 'text-purple-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                formData.mediaType === 'video' ? 'text-purple-700' : 'text-gray-700'
              }`}>
                Video
              </span>
              <span className="text-sm text-gray-500 mt-1">Select from videos</span>
            </button>
          </div>
        </div>

        {/* Image Upload Section */}
        {formData.mediaType === 'image' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Slide Image</h3>
            <div className="flex items-start space-x-6">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={
                        imagePreview.startsWith('blob:')
                          ? imagePreview                 // File preview
                          : getImageUrl(imagePreview)    // Saved image
                      }
                      alt="Slide preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <SafeIcons.Image className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isEdit ? 'Update Image' : 'Upload Image'} *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Recommended size: 1200x600px. Max file size: 5MB
                </p>
                {!imageFile && !imagePreview && !isEdit && (
                  <p className="text-sm text-red-600 mt-1">Image is required</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Selection Section */}
        {formData.mediaType === 'video' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Video</h3>
            
            {/* Video Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadAvailableVideos()}
                  placeholder="Search videos by title or description..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <SafeIcons.Search className="w-4 h-4 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={loadAvailableVideos}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-purple-600 hover:text-purple-800"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Selected Video Preview */}
            {formData.videoId && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Selected Video:</h4>
                <div className="flex items-center space-x-3">
                  {availableVideos.find(v => v._id === formData.videoId)?.thumbnailUrl ? (
                    <img
                      src={getImageUrl(availableVideos.find(v => v._id === formData.videoId)?.thumbnailUrl || '')}
                      alt="Video thumbnail"
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <SafeIcons.Video className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {availableVideos.find(v => v._id === formData.videoId)?.title || 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {availableVideos.find(v => v._id === formData.videoId)?.durationFormatted || ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('videoId', '')}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Videos List */}
            <div className="max-h-96 overflow-y-auto">
              {loadingVideos ? (
                <div className="text-center py-8">
                  <SafeIcons.Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading videos...</p>
                </div>
              ) : availableVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableVideos.map((video) => (
                    <div
                      key={video._id}
                      onClick={() => handleVideoSelect(video)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.videoId === video._id
                          ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex space-x-3">
                        {video.thumbnailUrl && !isImageError(video._id) ? (
                          <img
                            src={getImageUrl(video.thumbnailUrl)}
                            alt={video.title}
                            className="w-20 h-14 object-cover rounded"
                            onError={() => handleImageError(video._id)}
                          />
                        ) : (
                          <div className="w-20 h-14 bg-gray-100 rounded flex items-center justify-center">
                            <SafeIcons.Video className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{video.title}</p>
                          <p className="text-xs text-gray-500 truncate">{video.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-purple-600">{video.durationFormatted}</span>
                            {formData.videoId === video._id && (
                              <span className="text-xs font-medium text-purple-700">Selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No videos found. Try a different search term.
                </div>
              )}
            </div>

            {/* Video Settings */}
            {formData.videoId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Video Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Autoplay
                      </label>
                      <p className="text-sm text-gray-500">Start playing automatically</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVideoSettingChange('autoplay', !formData.videoSettings!.autoplay)}
                      className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                        formData.videoSettings!.autoplay ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                          formData.videoSettings!.autoplay ? 'transform translate-x-5' : 'transform translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loop
                      </label>
                      <p className="text-sm text-gray-500">Loop video continuously</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVideoSettingChange('loop', !formData.videoSettings!.loop)}
                      className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                        formData.videoSettings!.loop ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                          formData.videoSettings!.loop ? 'transform translate-x-5' : 'transform translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Muted
                      </label>
                      <p className="text-sm text-gray-500">Play without sound</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVideoSettingChange('muted', !formData.videoSettings!.muted)}
                      className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                        formData.videoSettings!.muted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                          formData.videoSettings!.muted ? 'transform translate-x-5' : 'transform translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Show Controls
                      </label>
                      <p className="text-sm text-gray-500">Show video controls</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVideoSettingChange('controls', !formData.videoSettings!.controls)}
                      className={`w-10 h-6 rounded-full transition-colors duration-200 ${
                        formData.videoSettings!.controls ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                          formData.videoSettings!.controls ? 'transform translate-x-5' : 'transform translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Slide Content</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter slide title"
              />
            </div>

            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter slide subtitle"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter slide description"
              />
            </div>
          </div>
        </div>

        {/* Button Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Call-to-Action Button</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => handleChange('buttonText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Shop Now, Learn More"
              />
            </div>

            <div>
              <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700 mb-2">
                Button Link
              </label>
              <input
                type="url"
                id="buttonLink"
                value={formData.buttonLink}
                onChange={(e) => handleChange('buttonLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., /products, https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Design Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Design Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  id="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  id="textColor"
                  value={formData.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduling (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Leave empty to show the slide indefinitely
          </p>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Status
                </label>
                <p className="text-sm text-gray-500">Show this slide on the website</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('isActive', !formData.isActive)}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
                    formData.isActive ? 'transform translate-x-7' : 'transform translate-x-1'
                  }`}
                />
              </button>
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
              <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`/admin/hero-sections/${id}/slides`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (formData.mediaType === 'video' && !formData.videoId)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <SafeIcons.Loader className="w-4 h-4 animate-spin" />}
            <span>{isEdit ? 'Update' : 'Create'} Slide</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SlideForm;