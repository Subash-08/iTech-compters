
import React from 'react';

const categories = [
  { name: 'CPUs', icon: '🧠', href: '#' },
  { name: 'GPUs', icon: '🎮', href: '#' },
  { name: 'Motherboards', icon: '🛠️', href: '#' },
  { name: 'RAM', icon: '💾', href: '#' },
  { name: 'Storage', icon: '💽', href: '#' },
  { name: 'Cases', icon: '🖥️', href: '#' },
  { name: 'Peripherals', icon: '🖱️', href: '#' },
  { name: 'Laptops', icon: '💻', href: '#' },
];

const CategoryHighlights: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">Shop by Category</h2>
            <p className="text-gray-600 mt-2">Find the perfect parts for your next build.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6">
          {categories.map((category) => (
            <a
              key={category.name}
              href={category.href}
              className="group flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl">{category.icon}</div>
              <span className="mt-2 font-semibold text-gray-700 text-center text-sm">{category.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryHighlights;
