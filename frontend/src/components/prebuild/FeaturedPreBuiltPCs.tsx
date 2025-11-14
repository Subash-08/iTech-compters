// components/prebuilt/FeaturedPreBuiltPCs.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { preBuiltPCActions } from '../../redux/actions/preBuiltPCActions';
import { selectFeaturedPCs, selectLoading } from '../../redux/selectors/preBuiltPCSelectors';
import PreBuiltPCCard from './PreBuiltPCCard';
import LoadingSpinner from '../admin/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const FeaturedPreBuiltPCs: React.FC = () => {
  const dispatch = useAppDispatch();
  const featuredPCs = useAppSelector(selectFeaturedPCs);
  const loading = useAppSelector(selectLoading);

  useEffect(() => {
    dispatch(preBuiltPCActions.fetchFeaturedPreBuiltPCs());
  }, [dispatch]);

  if (loading && featuredPCs.length === 0) {
    return (
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    );
  }

  if (featuredPCs.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Pre-built PCs
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Handpicked selection of high-performance computers for gaming, content creation, and productivity
          </p>
        </div>

        {/* Featured PCs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredPCs.slice(0, 4).map((pc) => (
            <PreBuiltPCCard key={pc._id} pc={pc} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/prebuilt-pcs"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View All Pre-built PCs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPreBuiltPCs;