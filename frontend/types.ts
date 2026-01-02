
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  status?: 'New' | 'Sale';
}
// types/navbar.ts
export interface NavbarSettings {
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logo: {
    url: string;
    altText: string;
    filename: string | null;
  };
}

export interface LogoSectionProps {
  variant?: 'desktop' | 'mobile' | 'mobile-menu';
  className?: string;
  showTagline?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
}