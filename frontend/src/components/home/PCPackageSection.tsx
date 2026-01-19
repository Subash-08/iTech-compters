import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import gamingPC from '../../assets/10016.webp'
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface ProductCardProps {
  category: string;
  title: string;
  price: string;
  image: string;
  delay?: number;
  className?: string;
  isWide?: boolean;
}

const ShopButton: React.FC = () => {
  const navigate = useNavigate(); // ✅ CORRECT PLACE

  return (
    <motion.button
      onClick={() => navigate('/prebuilt-pcs')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white text-black px-6 py-2.5 rounded-md font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30"
    >
      Shop Now
      <ChevronRight className="w-4 h-4 text-brand-orange" />
    </motion.button>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ 
  category, 
  title, 
  price, 
  image, 
  delay = 0,
  className = '',
  isWide = false
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`relative group overflow-hidden rounded-xl bg-black h-[450px] md:h-[500px] flex flex-col border border-white/10 ${className}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
         <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black via-black/50 to-black/30" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

      {/* Content Container - Centered Vertically and Horizontally */}
      <div className="relative z-20 flex flex-col h-full justify-center items-center text-center p-6 md:p-8">
        
        <div className="flex flex-col items-center space-y-3 md:space-y-4">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
            {category}
          </span>
          
          <h3 className={`font-black uppercase leading-[0.9] text-white ${isWide ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'}`}>
            {title.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h3>
          
          <p className="font-semibold text-brand-red text-lg md:text-xl tracking-wide text-white">
            {price}
          </p>

          <div className="pt-4 md:pt-6">
            <ShopButton />
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const PreBuildSection: React.FC = () => {
  return (
    <section className="relative w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16">
      {/* Header */}
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
          <span className="text-brand-orange">PRE BUILD</span> <span className="text-black">PC</span>
        </h2>
      </div>

      {/* Grid Layout: 1-2-1 Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Left Card: Narrower (1 col) */}
        {/* <div className="lg:col-span-1">
          <ProductCard
            category="Fast Performance"
            title="Gaming PC"
            price="Starting ₹39999"
            image="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1000&auto=format&fit=crop" 
            delay={0.1}
          />
        </div> */}

        {/* Center Card: Wider (2 cols) */}
        <div className="lg:col-span-4">
          <ProductCard
            category="Creative Power"
            title="Content Creation"
            price="Starting ₹49999"
            image="https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000&auto=format&fit=crop"
            delay={0.2}
            isWide={true}
          />
        </div>

        {/* Right Card: Narrower (1 col) */}
        {/* <div className="lg:col-span-1">
          <ProductCard
            category="Effortless Work"
            title="Workstation"
            price="Starting ₹49999"
            image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"
            delay={0.3}
          />
        </div> */}

      </div>
    </section>
  );
};

export default PreBuildSection;