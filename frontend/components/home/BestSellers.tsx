
import React, { useRef } from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

const products: Product[] = [
  {
    name: 'Intel Core i9-14900K Unlocked Desktop Processor',
    price: 549.99,
    originalPrice: 589.99,
    rating: 4.8,
    reviewCount: 215,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=i9-14900K',
    status: 'Sale',
  },
  {
    name: 'Lian Li PC-O11 Dynamic EVO ATX Mid Tower Case',
    price: 169.99,
    rating: 5.0,
    reviewCount: 942,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=Lian+Li+Case',
  },
  {
    name: 'Noctua NH-D15 chromax.black, 140mm Dual-Tower CPU Cooler',
    price: 109.95,
    rating: 4.9,
    reviewCount: 4501,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=Noctua+Cooler',
    status: 'New',
  },
  {
    name: 'G.Skill Trident Z5 Neo RGB Series 32GB DDR5 6000 CL30',
    price: 117.99,
    rating: 4.8,
    reviewCount: 1337,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=G.Skill+RAM',
  },
  {
    name: 'SeaSonic FOCUS Plus Gold 850 W 80+ Gold PSU',
    price: 129.99,
    originalPrice: 149.99,
    rating: 4.7,
    reviewCount: 987,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=Seasonic+PSU',
    status: 'Sale',
  },
  {
    name: 'Crucial T700 2TB Gen5 NVMe M.2 SSD with Heatsink',
    price: 269.99,
    rating: 4.9,
    reviewCount: 156,
    imageUrl: 'https://placehold.co/400x400/1e40af/ffffff?text=Gen5+SSD',
    status: 'New',
  },
];


const BestSellers: React.FC = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.offsetWidth * 0.9;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Our Best Sellers</h2>
          <div className="hidden sm:flex items-center space-x-2">
            <button onClick={() => scroll('left')} aria-label="Scroll left" className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={() => scroll('right')} aria-label="Scroll right" className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex space-x-6 overflow-x-auto pb-4 -mb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {products.map((product, index) => (
                <div key={index} className="flex-shrink-0 w-72 snap-start">
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
