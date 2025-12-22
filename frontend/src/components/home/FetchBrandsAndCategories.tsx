import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axiosConfig';
import { baseURL } from '../config/config';

// --- Icons --- //
const ArrowRightIcon = () => (
  <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

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
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: any;
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
    const prefix = process.env.NODE_ENV === "production" ? "" : baseURL;
    return `${prefix}${value.startsWith("/") ? value : "/" + value}`;
  };

  // Fetch Data
  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const [brandsRes, categoriesRes] = await Promise.all([
        api.get("/brands"),
        api.get("/categories"),
      ]);

      setBrands(brandsRes.data.brands || brandsRes.data || []);
      setCategories(categoriesRes.data.categories || categoriesRes.data || []);
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
    <div className="min-h-screen bg-white text-gray-900">



      {/* CATEGORIES SECTION — unchanged */}
      {categories.length > 0 && (
<section className="py-12">
  <div className="max-w-8xl mx-auto px-4 lg:px-12">

    <SectionHeader
      title="Curated Categories"
      subtitle="Explore our meticulously organized collection designed for efficiency and style."
    />

    <div
      className="
        grid grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-6 
        gap-x-4 gap-y-8 
        items-center 
        justify-items-center
      "
    >
      {categories.slice(0, 12).map((cat, idx) => (
        <Link
          key={cat._id}
          to={`/products/category/${cat.slug}`}
          className="
            group 
            flex flex-col 
            items-center 
            justify-center 
            transition-all 
            duration-300
            opacity-80 
            hover:opacity-100 
            hover:scale-105
          "
          style={{ transitionDelay: `${idx * 40}ms` }}
        >
          {/* Larger icon without any box */}
          <FadeImage
            src={getImageUrl(cat.image)}
            alt={cat.name}
            className="
              w-24 h-24 
              object-contain 
              grayscale-80
              group-hover:grayscale-0 
              transition-all 
              duration-300
            "
            fallback={<BoxIcon />}
          />

          {/* More balanced spacing */}
          <h3
            className="
              mt-2 
              text-sm 
              font-semibold 
              text-gray-900 
              group-hover:text-blue-600 
              transition-colors
              text-center
            "
          >
            {cat.name}
          </h3>
        </Link>
      ))}
    </div>

  </div>
</section>

      )}

      {/* ============================== */}
      {/*       UPDATED BRANDS SECTION   */}
      {/* ============================== */}

      {brands.length > 0 && (
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-8xl mx-auto px-6 lg:px-12">

            <SectionHeader
              title="Shop by Brands"
              subtitle="We collaborate with the world’s most innovative engineering teams."
            />

            {/* Pure logo strip – NO background boxes */}
            <div className="
              grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
              gap-x-8 gap-y-12
              items-center justify-items-center
            ">
              {brands.slice(0, 12).map((brand, idx) => (
                <Link
                  key={brand._id}
                  to={`/products/brand/${brand.slug}`}
                  className="
                    group 
                    flex items-center justify-center 
                    w-full 
                    opacity-90 
                    hover:opacity-100 
                    hover:grayscale-0 
                    hover:scale-105 
                    transition-all 
                    duration-300
                  "
                  style={{ transitionDelay: `${idx * 40}ms` }}
                >
                  <FadeImage
                    src={getImageUrl(brand.logo)}
                    alt={brand.name}
                    className="max-w-[120px] max-h-10 object-contain"
                    fallback={<BuildingIcon />}
                  />
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* FOOTER CTA — unchanged */}
      <section className="py-20 bg-black text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to upgrade your workflow?</h2>
        <p className="text-gray-400 mb-8">Join thousands of satisfied customers.</p>
        <Link to="/products" className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200">
          Browse Catalog
        </Link>
      </section>
      {/* HERO SECTION — unchanged */}
      <section className="relative pt-8 pb-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-6">
          Define Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">Tech Lifestyle.</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-10">
          Premium electronics curated for the modern professional.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/products" className="group flex items-center justify-center bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:scale-105 transition transform">
            Start Shopping <ArrowRightIcon />
          </Link>
          <Link to="/products?sort=newest" className="border border-gray-300 px-8 py-4 rounded-full hover:bg-gray-50 text-lg">
            View New Arrivals
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
