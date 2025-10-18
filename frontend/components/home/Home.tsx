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
import ProductList from './ProductList';
import HomePage from './fetchBrandsAndCategories';

const App: React.FC = () => {
  return (
    <div className="bg-white font-sans">
      <HeroSection />
      <CategoryHighlights />
      <FeaturedProducts />
      <HomePage />
      <BestSellers />
      <DealsSection />
      <PcBuilderPromo />
      <FeaturedBrands />
      <Testimonials />
      <BlogSection />
    </div>
  );
};

export default App;
