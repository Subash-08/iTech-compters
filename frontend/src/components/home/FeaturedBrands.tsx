
import React from 'react';

const brands = [
  { name: 'Intel', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=Intel' },
  { name: 'NVIDIA', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=NVIDIA' },
  { name: 'AMD', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=AMD' },
  { name: 'ASUS', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=ASUS' },
  { name: 'MSI', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=MSI' },
  { name: 'Corsair', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=Corsair' },
  { name: 'Logitech', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=Logitech' },
  { name: 'Razer', logoUrl: 'https://placehold.co/150x60/f0f0f0/333333?text=Razer' },
];

const FeaturedBrands: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Shop Top Brands</h2>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12">
          {brands.map((brand) => (
            <a key={brand.name} href="#" title={brand.name} className="flex-shrink-0">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-10 md:h-12 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrands;
