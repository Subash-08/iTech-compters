import api from '../../config/axiosConfig';
import { 
  NavbarSetting, 
  NavbarSettingFormData, 
  ApiResponse 
} from '../types/navbarSetting';

export const navbarSettingService = {
  // Get navbar settings
  async getNavbarSettings(): Promise<ApiResponse<NavbarSetting>> {
    try {
      const response = await api.get('/navbar-settings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching navbar settings:', error);
      throw error;
    }
  },

  // Update navbar settings
  async updateNavbarSettings(formData: FormData): Promise<ApiResponse<NavbarSetting>> {
    try {
      const response = await api.put('/admin/navbar-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating navbar settings:', error);
      throw error;
    }
  },

  // Reset navbar settings to defaults
  async resetNavbarSettings(): Promise<ApiResponse<NavbarSetting>> {
    try {
      const response = await api.post('/admin/navbar-settings/reset');
      return response.data;
    } catch (error: any) {
      console.error('Error resetting navbar settings:', error);
      throw error;
    }
  },

  // Helper: Convert form data to FormData
  createFormData(formData: NavbarSettingFormData): FormData {
    const formDataObj = new FormData();
    
    // Append text fields
    formDataObj.append('siteName', formData.siteName);
    formDataObj.append('fontFamily', formData.fontFamily);
    formDataObj.append('primaryColor', formData.primaryColor);
    formDataObj.append('secondaryColor', formData.secondaryColor);
    formDataObj.append('tagline', formData.tagline);
    
    // Append logo file if provided
    if (formData.logo) {
      formDataObj.append('logo', formData.logo);
    }
    
    return formDataObj;
  },

  // Helper: Get font family CSS class
  getFontFamilyClass(fontFamily: string): string {
    const fontMap: Record<string, string> = {
      'font-sans': 'ui-sans-serif, system-ui, sans-serif',
      'font-serif': 'ui-serif, Georgia, serif',
      'font-mono': 'ui-monospace, SFMono-Regular, monospace',
      'font-poppins': "'Poppins', sans-serif",
      'font-roboto': "'Roboto', sans-serif",
      'font-inter': "'Inter', sans-serif",
      'font-montserrat': "'Montserrat', sans-serif"
    };
    
    return fontMap[fontFamily] || fontMap['font-sans'];
  },

  // Helper: Get default settings
  getDefaultSettings(): Omit<NavbarSetting, '_id' | 'createdAt' | 'updatedAt' | 'updatedBy'> {
    return {
      siteName: 'iTech Computers',
      tagline: 'Premium Electronics',
      primaryColor: '#2c2358',
      secondaryColor: '#544D89',
      fontFamily: 'font-sans',
      logo: {
        url: '',
        altText: 'iTech Computers Logo',
        filename: null
      }
    };
  }
};