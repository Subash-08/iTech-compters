// components/prebuilt/PreBuiltPCDetail.tsx - UPDATED VERSION
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { preBuiltPCActions } from '../../redux/actions/preBuiltPCActions';
import { selectCurrentPC, selectLoading, selectError } from '../../redux/selectors/preBuiltPCSelectors';
import AddToCartButton from '../product/AddToCartButton';
import AddToWishlistButton from '../product/AddToWishlistButton';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import { Star, Shield, TrendingUp, Check } from 'lucide-react';

const PreBuiltPCDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const currentPC = useAppSelector(selectCurrentPC);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      dispatch(preBuiltPCActions.fetchPreBuiltPCBySlug(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (error) {
      console.error('Error loading PC:', error);
    }
  }, [error]);

  // ✅ CALCULATE PRICES USING NEW FIELDS
  const basePrice = currentPC?.basePrice || currentPC?.totalPrice || 0;
  const offerPrice = currentPC?.offerPrice || currentPC?.discountPrice || basePrice;
  const discountPercentage = currentPC?.discountPercentage || 
    (offerPrice < basePrice ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0);
  const hasDiscount = discountPercentage > 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error || !currentPC) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">PC Not Found</h1>
          <p className="text-gray-600 mb-8">The pre-built PC you're looking for doesn't exist.</p>
          <Link
            to="/prebuilt-pcs"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse All PCs
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = currentPC.images?.[selectedImageIndex]?.url || '/uploads/default-pc.jpg';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link to="/" className="hover:text-blue-600">Home</Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            <Link to="/prebuilt-pcs" className="hover:text-blue-600">Pre-built PCs</Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{currentPC.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <img
              src={mainImage}
              alt={currentPC.name}
              className="w-full h-96 object-contain rounded"
            />
          </div>
          
          {/* Thumbnail Images */}
          {currentPC.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {currentPC.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded ${
                    selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${currentPC.name} ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {currentPC.category}
            </span>
            
            {/* ✅ CONDITION BADGE */}
            <span className={`inline-block text-sm px-3 py-1 rounded-full ${
              currentPC.condition === 'New' 
                ? 'bg-green-100 text-green-800'
                : currentPC.condition === 'Refurbished'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentPC.condition || 'New'}
            </span>
            
            {currentPC.featured && (
              <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                Featured
              </span>
            )}
            {currentPC.isTested && (
              <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Benchmarked
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentPC.name}</h1>
          
          <p className="text-gray-600 mb-6">{currentPC.shortDescription || currentPC.description}</p>

          {/* ✅ USER RATING */}
          {(currentPC.averageRating || 0) > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                <span className="font-semibold">{currentPC.averageRating.toFixed(1)}</span>
                <span className="text-gray-500 ml-2">({currentPC.totalReviews || 0} reviews)</span>
              </div>
            </div>
          )}

          {/* Performance Rating */}
          <div className="flex items-center mb-6">
            <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
              <Star className="w-5 h-5 text-blue-500 mr-1" />
              <span className="font-semibold">{currentPC.performanceRating}/10</span>
              <span className="text-gray-500 ml-2">Performance Rating</span>
            </div>
          </div>

          {/* ✅ UPDATED PRICING */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-gray-900">Rs {offerPrice.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">Rs {basePrice.toLocaleString()}</span>
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded">
                    Save {discountPercentage}%
                  </span>
                </>
              )}
            </div>
            
            {/* ✅ SAVINGS DISPLAY */}
            {hasDiscount && (
              <div className="text-green-600 font-medium mb-2">
                You save Rs {(basePrice - offerPrice).toLocaleString()}
              </div>
            )}
            
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Warranty: {currentPC.warranty}</span>
            </div>
          </div>

          {/* Stock Status */}
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium mb-6 ${
            (currentPC.stockQuantity || 0) > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {(currentPC.stockQuantity || 0) > 0 
              ? `✅ ${currentPC.stockQuantity} in stock` 
              : '❌ Out of stock'
            }
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <AddToCartButton
              productId={currentPC._id}
              productName={currentPC.name}
              productPrice={offerPrice}
              productImage={mainImage}
              stockQuantity={currentPC.stockQuantity || 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-semibold transition-colors"
              disabled={(currentPC.stockQuantity || 0) === 0}
              productType="prebuilt-pc"
            />
            
            <AddToWishlistButton
              productId={currentPC._id}
              productType="prebuilt-pc"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2"
            />
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Ready to Ship</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Free Technical Support</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Quality Tested</span>
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span>Warranty Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Components Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">System Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPC.components.map((component, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {component.image?.url && (
                  <img
                    src={component.image.url}
                    alt={component.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm text-gray-500 uppercase font-semibold">
                    {component.partType}
                  </div>
                  <h3 className="font-semibold text-gray-900">{component.name}</h3>
                  <div className="text-sm text-gray-600">{component.brand}</div>
                  <div className="text-sm text-gray-500 mt-1">{component.specs}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Section */}
      {currentPC.isTested && currentPC.benchmarkTests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Performance Benchmarks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPC.benchmarkTests.map((test, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{test.testName}</h3>
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    {test.testCategory}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {test.score} {test.unit}
                </div>
                {test.comparison && (
                  <div className="text-sm text-gray-600">
                    Better than {test.comparison.betterThan}% of similar builds
                  </div>
                )}
                {test.description && (
                  <p className="text-sm text-gray-600 mt-2">{test.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-4">Description</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line">{currentPC.description}</p>
        </div>
      </div>
    </div>
  );
};

export default PreBuiltPCDetail;