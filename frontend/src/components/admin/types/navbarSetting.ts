export interface Logo {
  url: string;
  altText: string;
  filename: string | null;
}

export interface NavbarSetting {
  _id: string;
  logo: Logo;
  siteName: string;
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NavbarSettingFormData {
  siteName: string;
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  logo?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  settings?: T;
  error?: string;
}

export interface FontOption {
  value: string;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'font-sans', label: 'Sans Serif' },
  { value: 'font-serif', label: 'Serif' },
  { value: 'font-mono', label: 'Monospace' },
  { value: 'font-poppins', label: 'Poppins' },
  { value: 'font-roboto', label: 'Roboto' },
  { value: 'font-inter', label: 'Inter' },
  { value: 'font-montserrat', label: 'Montserrat' },
];