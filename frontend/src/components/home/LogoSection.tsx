import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { navbarSettingService } from '../admin/services/navbarSettingService';
import { LogoSectionProps } from '../../../types';
import logo from '../../assets/logo.png';

const LogoSection: React.FC<LogoSectionProps> = ({ 
  variant = 'desktop',
  className = '',
  showTagline = true,
  logoSize = 'md'
}) => {
  const [navbarSettings, setNavbarSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNavbarSettings();
  }, []);

  const fetchNavbarSettings = async (): Promise<void> => {
    try {
      const response = await navbarSettingService.getNavbarSettings();
      
      if (response.success && response.settings) {
        setNavbarSettings(response.settings);
      } else {
        // Fallback to default settings
        setNavbarSettings({
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
        });
      }
    } catch (error) {
      console.error('Error fetching navbar settings:', error);
      // Fallback to default settings
      setNavbarSettings({
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
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = logo;
  };

  // Get logo size based on variant
  const getLogoSize = () => {
    if (variant === 'mobile-menu') return 'w-8 h-8';
    if (variant === 'mobile') return 'w-8 h-8';
    if (logoSize === 'sm') return 'w-8 h-8';
    if (logoSize === 'lg') return 'w-16 h-16';
    return 'w-12 h-12'; // md
  };

  // Get text size based on variant
  const getTextSize = () => {
    if (variant === 'mobile-menu') return 'text-base';
    if (variant === 'mobile') return 'text-lg';
    return 'text-2xl';
  };

  // Get gap size
  const getGapSize = () => {
    if (variant === 'mobile-menu') return 'gap-2';
    if (variant === 'mobile') return 'gap-2';
    return 'gap-3';
  };

  // Get font style
  const getFontStyle = () => {
    if (navbarSettings?.fontFamily) {
      return {
        fontFamily: navbarSettingService.getFontFamilyClass(navbarSettings.fontFamily)
      };
    }
    return {};
  };

  if (loading) {
    return (
      <div className={`flex items-center ${getGapSize()} ${className}`}>
        <div className={`${getLogoSize()} bg-gray-200 rounded-lg animate-pulse`}></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          {showTagline && <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>}
        </div>
      </div>
    );
  }

  const logoUrl = navbarSettings?.logo?.url || logo;
  const siteName = navbarSettings?.siteName || 'iTech Computers';
  const tagline = navbarSettings?.tagline || 'Premium Electronics';
  const primaryColor = navbarSettings?.primaryColor || '#2c2358';
  const secondaryColor = navbarSettings?.secondaryColor || '#544D89';

  return (
    <Link 
      to="/" 
      className={`flex items-center ${getGapSize()} group ${className}`}
      aria-label={`Go to ${siteName} homepage`}
    >
      {/* Logo Image */}
      <img 
        src={logoUrl} 
        alt={navbarSettings?.logo?.altText || siteName}
        className={`${getLogoSize()} object-contain transition-transform group-hover:scale-105`}
        onError={handleImageError}
      />

      {/* Text Content */}
      <div 
        className="flex flex-col leading-tight"
        style={getFontStyle()}
      >
        {/* Site Name */}
        <span 
          className={`${getTextSize()} font-extrabold uppercase tracking-tight transition-colors group-hover:opacity-90`}
          style={{ color: primaryColor }}
        >
          {siteName}
        </span>
        
        {/* Tagline - only shown if enabled and variant supports it */}
        {showTagline && variant !== 'mobile' && (
          <span 
            className="text-[10px] tracking-widest uppercase font-medium"
            style={{ color: secondaryColor }}
          >
            {tagline}
          </span>
        )}
        
        {/* Mobile variant shows tagline differently */}
        {showTagline && variant === 'mobile' && (
          <span 
            className="text-xs tracking-wide font-medium opacity-80"
            style={{ color: secondaryColor }}
          >
            {tagline}
          </span>
        )}
      </div>
    </Link>
  );
};

export default LogoSection;