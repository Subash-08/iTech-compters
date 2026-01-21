import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axiosConfig';
import { baseURL } from '../config/config';
import { brandService } from '../admin/services/brandService';
import { categoryAPI } from '../admin/services/categoryAPI'; // Import Category API

// --- Icons --- //
const BoxIcon = () => (
  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// ---- TYPES ---- //
interface BrandLogo {
  url: string | null;
  altText: string | null;
  publicId: string | null;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: BrandLogo;
  isFeatured?: boolean;
  order?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: any;
  // Added fields for sorting
  isFeatured?: boolean;
  order?: number;
}

// ---- UTILITY COMPONENTS ---- //
const FadeImage = ({ src, alt, className, fallback }: any) => {
  const [isLoaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error)
    return <div className={`flex items-center justify-center ${className}`}>{fallback}</div>;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
        }`}
      />
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="text-center mb-16 space-y-4">
    <h1 className="text-6xl font-bold tracking-tight mb-6">
      {title}
    </h1>
    <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">{subtitle}</p>
  </div>
);

// ---- MAIN COMPONENT ---- //
const HomePage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getImageUrl = (url: any) => {
    if (!url) return "";
    const value = typeof url === "string" ? url : url.url;
    if (!value) return "";
    if (value.startsWith("http")) return value;
    const prefix = baseURL;
    return `${prefix}${value.startsWith("/") ? value : "/" + value}`;
  };

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      
      const [brandsRes, categoriesRes] = await Promise.all([
        brandService.getPublicShowcaseBrands(),
        // UPDATED: Use specific showcase endpoint for categories too
        categoryAPI.getHomeShowcaseCategories(), 
      ]);

      // --- 1. PROCESS BRANDS ---
      let fetchedBrands: Brand[] = brandsRes.brands || [];
      
      fetchedBrands.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        const orderA = a.order && a.order > 0 ? a.order : 999999;
        const orderB = b.order && b.order > 0 ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

      setBrands(fetchedBrands.slice(0, 12)); 

      // --- 2. PROCESS CATEGORIES ---
      let fetchedCategories: Category[] = categoriesRes.categories || categoriesRes.data || [];

      fetchedCategories.sort((a, b) => {
        // Priority: Featured
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        
        // Priority: Order (Treat 0 as last)
        const orderA = a.order && a.order > 0 ? a.order : 999999;
        const orderB = b.order && b.order > 0 ? b.order : 999999;
        
        if (orderA !== orderB) return orderA - orderB;
        
        // Priority: Alphabetical
        return a.name.localeCompare(b.name);
      });

      setCategories(fetchedCategories.slice(0, 12));
      
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHomepageData(); }, []);

  // ---- Loading ---- //
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-14 h-14 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---- Error ---- //
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-2xl shadow max-w-sm text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button onClick={fetchHomepageData} className="bg-black text-white px-6 py-3 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 mb-16">

      {/* CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="py-12">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-12">

            <SectionHeader
              title="Curated Categories"
              subtitle="Explore our meticulously organized collection designed for efficiency and style."
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8 items-center justify-items-center">
              {categories.map((cat, idx) => (
                <Link
                  key={cat._id}
                  to={`/products/category/${cat.slug}`}
                  className="group flex flex-col items-center justify-center transition-all duration-200 opacity-100 hover:opacity-100 hover:scale-105"
                  style={{ transitionDelay: `${idx * 40}ms` }}
                >
                  <FadeImage
                    src={getImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-28 h-28 object-contain grayscale-80 group-hover:grayscale-0 transition-all duration-200"
                    fallback={<BoxIcon />}
                  />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                    {cat.name}
                  </h3>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ============================== */}
      {/* FEATURED BRANDS SECTION   */}
      {/* ============================== */}

      {brands.length > 0 && (
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

            <SectionHeader
              title="Shop by Brands"
              subtitle="We collaborate with the world’s most innovative engineering teams."
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 items-center justify-items-center">
              {brands.map((brand, idx) => (
                <Link
                  key={brand._id}
                  to={`/products/brand/${brand.slug}`}
                  className="group flex items-center justify-center w-full opacity-90 hover:opacity-100 hover:grayscale-0 hover:scale-105 transition-all duration-200"
                  style={{ transitionDelay: `${idx * 40}ms` }}
                >
                  <FadeImage
                    src={getImageUrl(brand.logo)}
                    alt={brand.name}
                    className="w-24 h-24 object-contain grayscale-80 group-hover:grayscale-0 transition-all duration-200"
                    fallback={<BuildingIcon />}
                  />
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;