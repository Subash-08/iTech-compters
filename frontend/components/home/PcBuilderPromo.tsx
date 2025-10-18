
import React from 'react';

const PcBuilderPromo: React.FC = () => {
  return (
    <section className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="lg:w-1/2 flex-shrink-0">
            <img 
              src="https://placehold.co/600x450/1f2937/9ca3af?text=Custom+PC" 
              alt="A custom built gaming PC with RGB lighting"
              className="rounded-lg shadow-2xl"
            />
          </div>
          <div className="lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-400">Unleash Your Vision</h2>
            <p className="mt-4 text-lg text-gray-300">
              Don't just buy a PC, create your own. Our intuitive PC Builder guides you through component selection,
              ensuring compatibility and performance every step of the way.
            </p>
            <a 
              href="#"
              className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105"
            >
              Start Building Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PcBuilderPromo;
