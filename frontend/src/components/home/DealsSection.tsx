import React from 'react';
// Make sure this path is correct relative to this file
import Peripherals from '../../assets/Peripherals.png'; 
import gpu from '../../assets/gpu.png'; 

const deals = [
  {
    title: 'Up to 30% Off GPUs',
    description: 'Upgrade your graphics power for less. Limited time offer!',
    // FIX: Use the variable directly, without curly braces
    imageUrl: gpu, 
    href: '/products/category/gpu',
    cta: 'Shop GPUs',
  },
  {
    title: 'Gaming Peripherals Sale',
    description: 'Keyboards, mice, and headsets from top brands on sale now.',
    // FIX: Use the variable directly, without curly braces
    imageUrl: Peripherals,
    href: '/products/category/peripherals',
    cta: 'Explore Deals',
  },
];

const DealsSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {deals.map((deal) => (
            <a 
              key={deal.title}
              href={deal.href}
              className="group relative block h-96 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
            >
              {/* Background Image with Overlay Effect */}
              <div className="absolute inset-0">
                <img
                  src={deal.imageUrl}
                  alt={deal.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90"></div>
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                <h3 className="text-3xl font-bold text-white mb-2">{deal.title}</h3>
                <p className="text-gray-200 text-lg mb-6">{deal.description}</p>
                
                {/* Call to Action Button */}
                <div>
                  <span className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 group-hover:bg-blue-700 group-hover:shadow-md">
                    {deal.cta}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;