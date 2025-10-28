import React from 'react';
import HeroSection from './HeroSection';
import CategoryHighlights from './CategoryHighlights';
import FeaturedProducts from './FeaturedProducts';
import BestSellers from './BestSellers';
import DealsSection from './DealsSection';
import PcBuilderPromo from './PcBuilderPromo';
import FeaturedBrands from './FeaturedBrands';
import Testimonials from './Testimonials';
import BlogSection from './BlogSection';
import HomePage from './FetchBrandsAndCategories';

const App: React.FC = () => {
  return (
    <div className="bg-white font-sans">
      <HeroSection />
      <HomePage />
      <DealsSection />
      <PcBuilderPromo />
      <Testimonials />
      <BlogSection />
    </div>
  );
};

export default App;
