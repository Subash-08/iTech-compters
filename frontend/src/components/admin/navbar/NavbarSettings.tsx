import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { navbarSettingService } from '../services/navbarSettingService';
import { 
  NavbarSetting, 
  NavbarSettingFormData, 
  FONT_OPTIONS 
} from '../types/navbarSetting';
import { 
  Upload, 
  RefreshCw, 
  Save, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Eye,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface NavbarSettingsProps {
  // Props if needed for parent component
}

const NavbarSettings: React.FC<NavbarSettingsProps> = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentSettings, setCurrentSettings] = useState<NavbarSetting | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    reset,
    formState: { errors, isDirty } 
  } = useForm<NavbarSettingFormData>({
    defaultValues: {
      siteName: '',
      fontFamily: 'font-sans',
      primaryColor: '#2c2358',
      secondaryColor: '#544D89',
      tagline: ''
    }
  });

  // Watch form values for live preview
  const currentSiteName = watch('siteName') || currentSettings?.siteName || 'iTech Computers';
  const currentTagline = watch('tagline') || currentSettings?.tagline || 'Premium Electronics';
  const currentPrimaryColor = watch('primaryColor') || currentSettings?.primaryColor || '#2c2358';
  const currentSecondaryColor = watch('secondaryColor') || currentSettings?.secondaryColor || '#544D89';
  const currentFontFamily = watch('fontFamily') || currentSettings?.fontFamily || 'font-sans';

  useEffect(() => {
    fetchNavbarSettings();
  }, []);

  const fetchNavbarSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await navbarSettingService.getNavbarSettings();
      
      if (response.success && response.settings) {
        setCurrentSettings(response.settings);
        
        // Set form values
        setValue('siteName', response.settings.siteName);
        setValue('fontFamily', response.settings.fontFamily);
        setValue('primaryColor', response.settings.primaryColor);
        setValue('secondaryColor', response.settings.secondaryColor);
        setValue('tagline', response.settings.tagline);
        
        // Reset dirty flag
        reset(response.settings);
        
        if (initialLoad) {
          toast.success('Navbar settings loaded successfully!', {
            position: "bottom-center",
            autoClose: 3000,
          });
          setInitialLoad(false);
        }
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load navbar settings';
      console.error('Error fetching navbar settings:', errorMessage);
      
      // Only show toast on initial load error
      if (initialLoad) {
        toast.error('Using default settings. Backend not configured.', {
          position: "top-right",
          autoClose: 5000,
        });
        setInitialLoad(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF', {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Set file in form data
      setValue('logo', file, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<NavbarSettingFormData> = async (data): Promise<void> => {
    try {
      setLoading(true);
      
      // Create FormData
      const formData = navbarSettingService.createFormData(data);
      
      const response = await navbarSettingService.updateNavbarSettings(formData);
      
      if (response.success && response.settings) {
        setCurrentSettings(response.settings);
        setImagePreview(null); // Clear temporary preview
        
        // Clear file input
        const fileInput = document.getElementById('logo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Update form values
        reset(response.settings);
        
        toast.success('Navbar settings updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Refetch settings to get updated data
        fetchNavbarSettings();
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update settings';
      console.error('Error updating navbar settings:', errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (): Promise<void> => {
    if (window.confirm('Are you sure you want to reset to default settings? This cannot be undone.')) {
      try {
        setLoading(true);
        
        const response = await navbarSettingService.resetNavbarSettings();
        
        if (response.success && response.settings) {
          setCurrentSettings(response.settings);
          setImagePreview(null);
          
          // Update form values
          setValue('siteName', response.settings.siteName);
          setValue('fontFamily', response.settings.fontFamily);
          setValue('primaryColor', response.settings.primaryColor);
          setValue('secondaryColor', response.settings.secondaryColor);
          setValue('tagline', response.settings.tagline);
          
          // Reset form
          reset(response.settings);
          
          // Clear file input
          const fileInput = document.getElementById('logo') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          
          toast.success('Settings reset to defaults', {
            position: "top-right",
            autoClose: 3000,
          });
          
          // Refetch settings
          fetchNavbarSettings();
        } else {
          throw new Error(response.message || 'Failed to reset settings');
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to reset settings';
        console.error('Error resetting settings:', errorMessage);
        
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Get font family for preview
  const getFontFamilyStyle = (fontFamily: string): React.CSSProperties => {
    return {
      fontFamily: navbarSettingService.getFontFamilyClass(fontFamily)
    };
  };

  if (loading && !currentSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#544D89]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Navbar Settings</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Customize your site's logo, name, and appearance
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Logo & Branding</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Logo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="New logo preview" 
                        className="w-full h-full object-contain p-3"
                      />
                    ) : currentSettings?.logo?.url ? (
                      <img 
                        src={currentSettings.logo.url} 
                        alt={currentSettings.logo.altText} 
                        className="w-full h-full object-contain p-3"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/uploads/logo/default-logo.png';
                        }}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Upload logo</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block">
                    <div className="relative">
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#544D89] file:text-white hover:file:bg-[#433d6e] disabled:opacity-50"
                        disabled={loading}
                      />
                      <div className="absolute inset-0 pointer-events-none opacity-0"></div>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 300x300px PNG with transparent background (Max: 2MB)
                  </p>
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Leave empty to keep current logo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Logo Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Logo Info
              </label>
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Alt Text:</span> {currentSettings?.logo?.altText || 'Site Logo'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Status:</span> {currentSettings?.logo?.url ? 'Custom logo' : 'Default logo'}
                </p>
                {currentSettings?.logo?.url && (
                  <p className="text-xs text-gray-500 truncate">
                    URL: {currentSettings.logo.url}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Site Information */}
        <div className="border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Site Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name *
              </label>
              <input
                type="text"
                {...register('siteName', { 
                  required: 'Site name is required',
                  minLength: {
                    value: 2,
                    message: 'Site name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Site name must be less than 50 characters'
                  }
                })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#544D89] focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter site name"
                disabled={loading}
              />
              {errors.siteName && (
                <p className="mt-1 text-sm text-red-600">{errors.siteName.message}</p>
              )}
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                {...register('tagline', {
                  maxLength: {
                    value: 100,
                    message: 'Tagline must be less than 100 characters'
                  }
                })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#544D89] focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter tagline"
                disabled={loading}
              />
              {errors.tagline && (
                <p className="mt-1 text-sm text-red-600">{errors.tagline.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Will appear below site name
              </p>
            </div>
          </div>
        </div>

        {/* Design Settings */}
        <div className="border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Design Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                {...register('fontFamily')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#544D89] focus:border-transparent disabled:bg-gray-100"
                disabled={loading}
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Font for site name and tagline
              </p>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('primaryColor')}
                  className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300 disabled:opacity-50"
                  disabled={loading}
                  value={currentPrimaryColor}
                  onChange={(e) => setValue('primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  {...register('primaryColor', {
                    pattern: {
                      value: /^#[0-9A-Fa-f]{6}$/,
                      message: 'Must be a valid hex color (e.g., #2c2358)'
                    }
                  })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#544D89] focus:border-transparent disabled:bg-gray-100"
                  placeholder="#2c2358"
                  disabled={loading}
                />
              </div>
              {errors.primaryColor && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
              )}
            </div>

            {/* Secondary Color */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  {...register('secondaryColor')}
                  className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300 disabled:opacity-50"
                  disabled={loading}
                  value={currentSecondaryColor}
                  onChange={(e) => setValue('secondaryColor', e.target.value)}
                />
                <input
                  type="text"
                  {...register('secondaryColor', {
                    pattern: {
                      value: /^#[0-9A-Fa-f]{6}$/,
                      message: 'Must be a valid hex color (e.g., #544D89)'
                    }
                  })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#544D89] focus:border-transparent disabled:bg-gray-100"
                  placeholder="#544D89"
                  disabled={loading}
                />
              </div>
              {errors.secondaryColor && (
                <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Primary color is used for site name, secondary for tagline
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="border rounded-xl p-4 sm:p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            <Eye className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 border shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Logo Preview */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden border">
                {currentSettings?.logo?.url ? (
                  <img 
                    src={currentSettings.logo.url} 
                    alt={currentSettings.logo.altText} 
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/uploads/logo/default-logo.png';
                    }}
                  />
                ) : (
                  <div className="text-gray-300 text-sm">Logo</div>
                )}
              </div>
              
              {/* Text Preview */}
              <div className="flex-1 text-center sm:text-left">
                <span 
                  className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight block"
                  style={{ 
                    color: currentPrimaryColor,
                    ...getFontFamilyStyle(currentFontFamily)
                  }}
                >
                  {currentSiteName}
                </span>
                <span 
                  className="text-xs sm:text-sm tracking-widest uppercase font-medium block mt-1"
                  style={{ color: currentSecondaryColor }}
                >
                  {currentTagline}
                </span>
                
                {/* Preview Info */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: currentPrimaryColor }}
                    ></div>
                    <span>Primary: {currentPrimaryColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: currentSecondaryColor }}
                    ></div>
                    <span>Secondary: {currentSecondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    <span>
                      Font: {FONT_OPTIONS.find(f => f.value === currentFontFamily)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview Note */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Preview shows how your navbar will appear to visitors. Changes are live after saving.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Changes take effect immediately after saving
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !isDirty}
            className="flex items-center gap-2 px-6 py-3 bg-[#544D89] text-white font-medium rounded-lg hover:bg-[#433d6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NavbarSettings;