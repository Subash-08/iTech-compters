
import React, { useState, useEffect } from 'react';

const slides = [
  {
    bgImage: 'https://placehold.co/1920x800/0f172a/60a5fa?text=Big+PC+Upgrade+Sale',
    title: 'The Big PC Upgrade Sale',
    subtitle: 'Up to 40% off on CPUs, GPUs, and Motherboards!',
    cta: 'Shop Now',
    href: '#',
  },
  {
    bgImage: 'https://placehold.co/1920x800/0c4a6e/e0f2fe?text=Build+Your+Dream+PC',
    title: 'Build Your Dream PC',
    subtitle: 'Use our powerful and easy-to-use Custom PC Builder.',
    cta: 'Start Building',
    href: '#',
  },
  {
    bgImage: 'https://placehold.co/1920x800/1e293b/94a3b8?text=Featuring+Top+Brands',
    title: 'Featuring Top Brands',
    subtitle: 'The latest hardware from Intel, NVIDIA, and AMD.',
    cta: 'Explore Brands',
    href: '#',
  },
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] bg-gray-900 text-white overflow-hidden">
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.bgImage})` }}
          >
            <div className="w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center max-w-3xl px-4">
                <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">{slide.title}</h1>
                <p className="mt-4 text-lg md:text-2xl drop-shadow-md">{slide.subtitle}</p>
                <a
                  href={slide.href}
                  className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105"
                >
                  {slide.cta}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-3 h-3 rounded-full transition-colors ${
              currentSlide === index ? 'bg-white' : 'bg-gray-400/50 hover:bg-white/70'
            }`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
