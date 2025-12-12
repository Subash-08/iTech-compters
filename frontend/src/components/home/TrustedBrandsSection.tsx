import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

const brands = [
  { name: "NVIDIA", url: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg" },
  { name: "AMD", url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg" },
  { name: "Intel", url: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Intel-logo.svg" },
  { name: "Corsair", url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Corsair_Components_Logo.svg" },
  { name: "ASUS", url: "https://upload.wikimedia.org/wikipedia/commons/2/20/ASUS_Logo.svg" },
  { name: "MSI", url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/MSI_Logo_2019.svg" },
  { name: "Razer", url: "https://upload.wikimedia.org/wikipedia/en/4/40/Razer_snake_logo.svg" },
  { name: "Samsung", url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
  { name: "Logitech", url: "https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg" },
  { name: "Gigabyte", url: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Gigabyte_Technology_logo_20080107.svg" },
  { name: "Western Digital", url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Western_Digital_logo.svg" },
  { name: "Seagate", url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Seagate_Logo.svg" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1], // Custom refined cubic-bezier
    },
  },
};

const TrustedBrandsSection: React.FC = () => {
  return (
    <section className="w-full bg-white py-24 border-t border-slate-100">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-5"
          >
            TRUSTED BY <span className="text-slate-400">LEADING BRANDS</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-slate-500 font-medium text-lg md:text-xl leading-relaxed"
          >
            We partner with the world's most innovative technology manufacturers to deliver uncompromising performance and reliability.
          </motion.p>
        </div>

        {/* Brand Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {brands.map((brand) => (
            <motion.div
              key={brand.name}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative h-32 md:h-40 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center p-6 md:p-8 cursor-pointer transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-300"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Logo Image */}
              <img 
                src={brand.url} 
                alt={`${brand.name} logo`} 
                className="relative z-10 w-full h-full object-contain opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 filter will-change-transform"
                loading="lazy"
              />

              {/* Brand Accent Indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <BadgeCheck className="w-5 h-5 text-brand-orange" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Tagline */}
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-16 text-center"
        >
            <p className="text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">
                Official Retail Partner
            </p>
        </motion.div>

      </div>
    </section>
  );
};

export default TrustedBrandsSection;