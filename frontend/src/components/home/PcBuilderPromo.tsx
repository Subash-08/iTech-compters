import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Cpu, Settings, ShieldCheck } from 'lucide-react';
import customPC from '../../assets/10068.png'
import { useNavigate } from 'react-router-dom';

// --- Configuration ---
const ASSETS = {
  pcChassis: customPC,
};

const ACCENT_GRADIENT = "from-blue-600 via-indigo-500 to-purple-600";
const ACCENT_GLOW = "bg-blue-500/30";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: "blur(10px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

const floatingAnimation = {
  y: [-10, 10],
  rotateX: [2, -2],
  transition: {
    duration: 4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
  },
};

const breathingGlow = {
  scale: [1, 1.1, 1],
  opacity: [0.4, 0.7, 0.4],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// --- Sub-components ---

const BackgroundGrid = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Subtle Grid Pattern */}
    <div 
      className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
    />
    {/* Subtle top gradient fade */}
    <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-50 to-transparent"></div>
  </div>
);

const FloatingParticle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 0 }}
    animate={{ opacity: [0, 0.5, 0], y: -100, x: parseInt(x) > 50 ? 50 : -50 }}
    transition={{ duration: 15, repeat: Infinity, delay, ease: "linear" }}
    className={`absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]`}
    style={{ left: x, top: y }}
  />
);

const FeaturePillar = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl hover:bg-slate-100/50 transition-colors duration-300 group">
    <motion.div
      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${ACCENT_GRADIENT} text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-100 group-hover:shadow-indigo-500/40 transition-all`}
    >
      <Icon size={24} strokeWidth={1.5} />
    </motion.div>
    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </motion.div>
);

// --- Main Component ---
const CustomPCSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative w-full min-h-[100vh] flex items-center justify-center overflow-hidden bg-slate-50 py-12 md:py-24">
      <BackgroundGrid />
      
      {/* Floating atmospheric particles */}
      <FloatingParticle delay={0} x="10%" y="80%" />
      <FloatingParticle delay={5} x="80%" y="60%" />
      <FloatingParticle delay={2} x="30%" y="90%" />
      <FloatingParticle delay={8} x="60%" y="70%" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-center"
        >
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-4 md:mb-6 space-y-2 md:space-y-4">
            <motion.h2 
              variants={itemVariants} 
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]"
            >
              Build Your <span className={`bg-clip-text text-transparent bg-gradient-to-r ${ACCENT_GRADIENT}`}>Custom PC</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto px-2">
              Freedom to configure. Precision-engineered for peak performance. Experience the next level of craftsmanship.
            </motion.p>
          </div>

          {/* Main Visual Centerpiece (Simulated 3D) */}
          <motion.div 
            variants={itemVariants}
            className="relative w-full max-w-4xl mx-auto h-[250px] md:h-[350px] lg:h-[450px] mb-4 md:mb-6 perspective-1000"
          >
            {/* The "RGB Breathing" Glow behind the PC */}
            <motion.div 
              animate={breathingGlow}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[100px] md:blur-[120px] ${ACCENT_GLOW} -z-10`} 
            />
            
            {/* The PC Chassis Floating Animation */}
            <motion.div
              animate={floatingAnimation}
              className="w-full h-full flex items-center justify-center"
            >
              {/* PC Image */}
              <img 
                src={ASSETS.pcChassis}
                alt="Custom PC Build Render"
                className="w-auto h-full object-contain drop-shadow-2xl max-w-[90%]"
                style={{ 
                  filter: "drop-shadow(0 25px 50px rgb(0 0 0 / 0.15))",
                  imageRendering: "crisp-edges"
                }}
              />
            </motion.div>

            {/* Start Building Button - Absolute positioned below PC */}
<motion.div 
  variants={itemVariants} 
  className="absolute -bottom-4 md:-bottom-8 left-1/3 transform -translate-x-1/2 z-20"
  whileHover={{ scale: 1.05 }} 
  whileTap={{ scale: 0.95 }}
>
  <button
    onClick={() => navigate('/prebuilt-pcs')}
    className={`group relative inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold text-white bg-gradient-to-r ${ACCENT_GRADIENT} rounded-full overflow-hidden shadow-xl shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50`}
  >
    <span className="relative z-10">Start Building</span>
    <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" />

    {/* Button Glow Overlay */}
    <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20" />

    {/* Enhanced glow effect */}
    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
  </button>
</motion.div>

          </motion.div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl px-4 md:px-0 relative mt-8 md:mt-12">
            {/* Glassmorphism background support for pillars */}
            <div className="absolute inset-0 -z-10 bg-slate-50/50 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-sm"></div>

            <FeaturePillar 
              icon={Cpu}
              title="Performance Tuned"
              desc="Every configuration is validated for thermal and power efficiency to ensure maximum frames."
            />
            <FeaturePillar 
              icon={Settings}
              title="Component-Level Choice"
              desc="Granular control over every part. Select the exact brands and specs you desire."
            />
            <FeaturePillar 
              icon={ShieldCheck}
              title="Lifetime Support"
              desc="Our expert team is here for you long after your build arrives. Precision craftsmanship guaranteed."
            />
          </div>

        </motion.div>
      </div>

      {/* CSS for image visibility */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        /* Ensure image loads properly */
        img {
          max-height: 100%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .perspective-1000 {
            perspective: none;
          }
        }
      `}</style>
    </section>
  );
};

export default CustomPCSection;