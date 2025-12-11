import React from 'react';
import CategoryHighlights from './CategoryHighlights';
import FeaturedProducts from './FeaturedProducts';
import BestSellers from './BestSellers';
import DealsSection from './DealsSection';
import PcBuilderPromo from './PcBuilderPromo';
import FeaturedBrands from './FeaturedBrands';
import Testimonials from './Testimonials';
import BlogSection from './BlogSection';
import HomePage from './FetchBrandsAndCategories';
import HeroSection from '../heroSection/HeroSection';
import ProductShowcaseContainer from '../showcase/ProductShowcaseContainer';
import InstagramReels from './InstagramReels';
import VideoSectionsPage from '../video/VideoSectionsPage';

const App: React.FC = () => {
  return (
    <div className="bg-white font-sans">
      <HeroSection />
      <ProductShowcaseContainer
          className="container mx-auto px-4"
        />
      <HomePage />
      <DealsSection />
      <PcBuilderPromo />
      <VideoSectionsPage />
       <section className="py-12">
        <div className="container mx-auto px-4">
          <InstagramReels 
            autoPlay={true}
            showThumbnails={true}
            className="rounded-xl shadow-2xl"
          />
        </div>
      </section>
      <Testimonials />
      <BlogSection />
    </div>
  );
};

export default App;
