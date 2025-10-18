
import React from 'react';

const deals = [
  {
    title: 'Up to 30% Off GPUs',
    description: 'Upgrade your graphics power for less. Limited time offer!',
    imageUrl: 'https://placehold.co/800x400/3b82f6/ffffff?text=GPU+Deals',
    href: '#',
    cta: 'Shop GPUs',
  },
  {
    title: 'Gaming Peripherals Sale',
    description: 'Keyboards, mice, and headsets from top brands on sale now.',
    imageUrl: 'https://placehold.co/800x400/10b981/ffffff?text=Peripheral+Sale',
    href: '#',
    cta: 'Explore Deals',
  },
];

const DealsSection: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {deals.map((deal) => (
            <a 
              key={deal.title}
              href={deal.href}
              className="group relative block bg-gray-900 rounded-lg overflow-hidden shadow-lg"
            >
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-300"
              />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="text-3xl font-bold text-white">{deal.title}</h3>
                <p className="text-gray-200 mt-2">{deal.description}</p>
                <div className="mt-4 inline-block">
                    <span className="bg-white text-gray-800 font-semibold py-2 px-4 rounded-md group-hover:bg-blue-100 transition-colors">
                        {deal.cta}
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
