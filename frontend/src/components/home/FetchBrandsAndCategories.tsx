import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axiosConfig';
import { baseURL } from '../config/config';

// Types
interface BrandLogo {
  url: string | null;
  altText: string | null;
  publicId: string | null;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo: BrandLogo;
  productCount?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  image?: string;
  productCount?: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  offerPrice?: number;
  discountPercentage?: number;
  images: {
    thumbnail?: string;
    gallery: string[];
  };
  brand: Brand;
  categories: Category[];
  stockQuantity: number;
  averageRating?: number;
  totalReviews?: number;
}

const HomePage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all homepage data using Axios
  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      setError('');

      const [brandsRes, categoriesRes] = await Promise.all([
        api.get('/brands'),
        api.get('/categories'),
      ]);

      const brandsData = brandsRes.data;
      const categoriesData = categoriesRes.data;

      setBrands(brandsData.brands || brandsData || []);
      setCategories(categoriesData.categories || categoriesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
// Get full image URL with proper error handling
const getImageUrl = (url: string | null | undefined) => {
  // Check if url is valid
  if (!url || typeof url !== 'string') {
    return 'https://placehold.co/300x300?text=No+Image';
  }

  // Already full URL (e.g., Cloudinary)
  if (url.startsWith('http')) return url;

  // Handle different environments
  if (process.env.NODE_ENV === 'production') {
    // In production, use relative path (same domain)
    return url.startsWith('/') ? url : `/${url}`;
  } else {
    // In development, use local backend
    const baseUrl = baseURL;
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }
};

  // Render product card
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <Link
      to={`/product/${product.slug}`}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-100 overflow-hidden relative">
        <img 
          src={getImageUrl(product.images.thumbnail || product.images.gallery?.[0])}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/300x300?text=Product+Image';
          }}
        />
        {product.discountPercentage && product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
            -{product.discountPercentage}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.offerPrice || product.basePrice)}
            </span>
            {product.offerPrice && product.offerPrice < product.basePrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>
          
          {product.averageRating && (
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600">
                {product.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{product.brand.name}</span>
          <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={fetchHomepageData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to Our Store
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Discover amazing products from top brands and categories. Quality guaranteed with fast delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Shop Now
            </Link>
            <Link
              to="/products?sort=newest"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </section>
{/* Categories Section */}
{categories.length > 0 && (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
        <p className="text-gray-600 text-lg">Browse products by your favorite categories</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.slice(0, 12).map(category => (
          <Link
            key={category._id}
            to={`/products/category/${category.slug}`}
            className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 group border border-gray-200 hover:border-blue-300"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-colors shadow-sm">
              {category.image?.url ? (
                <img 
                  src={getImageUrl(category.image.url)} // Use category.image.url
                  alt={category.image.altText || category.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    console.error('Failed to load category image:', category.image?.url);
                    e.currentTarget.src = 'https://placehold.co/80x80?text=📦';
                  }}
                />
              ) : (
                <span className="text-2xl text-gray-400">📦</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
      
      {categories.length > 12 && (
        <div className="text-center mt-8">
          <Link 
            to="/products" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View All Categories
          </Link>
        </div>
      )}
    </div>
  </section>
)}

      {/* Brands Section */}
      {brands.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Brands</h2>
              <p className="text-gray-600 text-lg">Shop from your favorite trusted brands</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {brands.slice(0, 12).map(brand => (
                <Link
                  key={brand._id}
                  to={`/products/brand/${brand.slug}`}
                  className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 group border border-gray-200 hover:border-blue-300"
                >
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 transition-colors p-2 shadow-sm">
                    {brand.logo?.url ? (
                      <img 
                        src={getImageUrl(brand.logo.url)} 
                        alt={brand.logo.altText || brand.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/80x80?text=Brand';
                        }}
                      />
                    ) : (
                      <div className="text-2xl text-gray-400">🏢</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {brand.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Explore More?</h2>
          <p className="text-xl mb-8 opacity-90">
            Discover our complete collection with thousands of products across all categories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              Browse All Products
            </Link>
            <Link
              to="/products?inStock=true"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
            >
              In Stock Items
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;