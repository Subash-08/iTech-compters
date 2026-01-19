// components/sections/TrustedBrandsSection.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { FeaturedBrand } from '../admin/types/featuredBrand';
import { featuredBrandService } from '../admin/services/featuredBrandService';
import { getImageUrl } from '../utils/imageUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const TrustedBrandsSection: React.FC = () => {
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedBrands();
  }, []);

  const fetchFeaturedBrands = async () => {
    try {
      setLoading(true);
      const response = await featuredBrandService.getFeaturedBrandsCount();
      
      // Only fetch brands if there are any
      if (response.hasBrands) {
        const brandsResponse = await featuredBrandService.getFeaturedBrands();
        setBrands(brandsResponse.data);
      } else {
        setBrands([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load brands');
      console.error('Error loading featured brands:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show the section if there are no brands or if loading
  if (loading) {
    return null; // You could return a loading skeleton here if desired
  }

  if (brands.length === 0 || error) {
    return null; // Don't show section if no brands or error
  }

  // Calculate grid columns based on number of brands
  const getGridColumns = () => {
    if (brands.length === 1) return 'grid-cols-1';
    if (brands.length === 2) return 'grid-cols-2';
    if (brands.length === 3) return 'grid-cols-3';
    if (brands.length === 4) return 'grid-cols-2 md:grid-cols-4';
    if (brands.length <= 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
  };

  const handleBrandClick = async (brandId: string, websiteUrl?: string) => {
    try {
      
      // Open website URL if available
      if (websiteUrl) {
        window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error tracking brand click:', err);
    }
  };

  return (
    <section className="w-full bg-white py-16 md:py-24 border-t border-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4 md:mb-5"
          >
            TRUSTED BY <span className="text-slate-400">LEADING BRANDS</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-slate-500 font-medium text-base sm:text-lg md:text-xl leading-relaxed"
          >
            We partner with the world's most innovative technology manufacturers to deliver uncompromising performance and reliability.
          </motion.p>
        </div>

        {/* Brand Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className={`grid ${getGridColumns()} gap-4 md:gap-6`}
        >
          {brands.map((brand) => (
            <motion.div
              key={brand._id}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleBrandClick(brand._id, brand.websiteUrl)}
              className="group relative h-28 sm:h-32 md:h-40 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center p-4 sm:p-6 md:p-8 cursor-pointer transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-300"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Logo Image */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {brand.logo?.url ? (
                  <img 
                    src={getImageUrl(brand.logo.url)} 
                    alt={brand.logo.altText || `${brand.name} logo`}
                    className="w-full h-full object-contain opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 filter will-change-transform"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to brand name if logo fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : (
                  <div className="logo-fallback w-full h-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-700 text-center">
                      {brand.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Brand Name Tooltip */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {brand.name}
                </div>
              </div>

              {/* Brand Accent Indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-brand-orange" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Tagline */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-12 md:mt-16 text-center"
        >
          <p className="text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">
            Official Retail Partner
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBrandsSection;