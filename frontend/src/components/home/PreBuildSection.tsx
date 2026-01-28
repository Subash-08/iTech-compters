import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { preBuildShowcaseService } from '../admin/services/preBuildShowcaseService';
import { PreBuildShowcaseItem } from '../admin/types/preBuildShowcase';
import { getImageUrl } from '../utils/imageUtils';

// --- Sub Components ---

const ShopButton: React.FC<{ link: string }> = ({ link }) => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(link)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white text-black px-6 py-2.5 rounded-md font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30"
    >
      Shop Now
      <ChevronRight className="w-4 h-4 text-brand-orange" />
    </motion.button>
  );
};

interface ProductCardProps {
  item: PreBuildShowcaseItem;
  delay?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`relative group overflow-hidden rounded-xl bg-black h-[450px] md:h-[500px] flex flex-col border border-white/10 ${
        item.isWide ? 'lg:col-span-4' : 'lg:col-span-1'
      }`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={getImageUrl(item.image)} 
          alt={item.title} 
          className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black via-black/50 to-black/30" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

      {/* Content Container */}
      <div className="relative z-20 flex flex-col h-full justify-center items-center text-center p-6 md:p-8">
        <div className="flex flex-col items-center space-y-3 md:space-y-4">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
            {item.category}
          </span>
          
          <h3 className={`font-black uppercase leading-[0.9] text-white ${
            item.isWide ? 'text-5xl md:text-7xl' : 'text-3xl md:text-4xl'
          }`}>
            {item.title.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h3>
          
          <p className="font-semibold text-white text-lg md:text-xl tracking-wide">
          {item.price}
          </p>

          <div className="pt-4 md:pt-6">
            <ShopButton link={item.buttonLink} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PreBuildSection: React.FC = () => {
  const [items, setItems] = useState<PreBuildShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await preBuildShowcaseService.getShowcaseItems();
        setItems(response.data);
      } catch (error) {
        console.error("Failed to load pre-build showcase", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) return null; // Or a skeleton loader
  if (items.length === 0) return null;

  return (
    <section className="relative w-full max-w-[1600px] mx-auto px-4 md:px-8 py-16">
      {/* Header */}
      <div className="mb-12 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
          <span className="text-brand-orange">PRE BUILD</span> <span className="text-black">PC</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item, index) => (
          <ProductCard 
            key={item._id} 
            item={item} 
            delay={index * 0.1}
          />
        ))}
      </div>
    </section>
  );
};

export default PreBuildSection;