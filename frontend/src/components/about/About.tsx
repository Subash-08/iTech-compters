import React from 'react';
import { Helmet } from 'react-helmet-async'; // ✅ Added SEO Import
import { motion, Variants } from 'framer-motion';
import { 
  ChevronRight, 
  MapPin,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react';
import { BRAND, OFFERINGS, TRUST_POINTS } from './constants';
import about from '../../assets/about-bg.avif' 
import { useNavigate } from 'react-router-dom';

const MainContent: React.FC = () => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] as const 
      } 
    }
  };
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full bg-white selection:bg-blue-500 selection:text-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={about} 
            alt="High-end Computing Workspace - iTech Computers Facility" 
            className="w-full h-full object-cover object-center scale-105 opacity-80"
          />
          
          {/* --- Multi-layered Gradient Overlay (Black Shade) --- */}
          {/* 1. Base dark tint for overall contrast */}
          <div className="absolute inset-0 bg-black/10" />
          
          {/* 2. Primary Directional Gradient: Solid Black (Left) fading to Transparent (Right) */}
          {/* This ensures text readability regardless of the image brightness */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/10 sm:to-transparent" />
          
          {/* 3. Vertical Gradient: Fades bottom edge to black/white for section blending */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <span className="inline-flex items-center px-4 py-2 text-[11px] font-bold tracking-[0.2em] text-blue-400 uppercase bg-blue-900/20 backdrop-blur-md border border-blue-500/20 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                Professional Tech Solutions in Salem
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-[88px] font-bold tracking-tight text-white leading-[0.95] mb-8"
            >
              Precision tech,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                expertly
              </span> curated.
            </motion.h1>
            
            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-slate-400 font-light leading-relaxed mb-12 max-w-xl"
            >
              From custom gaming rigs to enterprise-grade workstations, {BRAND.name} is your partner in building a high-performance future.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <a 
                href="#who-we-are" 
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide transition-all duration-300 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3 overflow-hidden"
              >
                <span className="relative z-10">OUR LEGACY</span>
                <ChevronRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
              </a>
              
              {/* Social Proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  {[44, 45, 46].map((id) => (
                    <div key={id} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden relative z-0 hover:z-10 transition-all hover:scale-110">
                        <img src={`https://i.pravatar.cc/100?u=${id}`} className="w-full h-full object-cover" alt="Happy Client" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">10k+ Clients</span>
                    <span className="text-slate-500 text-xs">Trust our builds</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- WHO WE ARE --- */}
      <section id="who-we-are" className="py-24 md:py-32 max-w-7xl mx-auto px-6 relative">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Decorative blob behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 rounded-full blur-3xl -z-10" />
            
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
                alt="Our Tech Excellence in Custom PC Building" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>
          </motion.div>

          <div className="space-y-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold tracking-tighter text-slate-900"
            >
              Excellence is not a standard, <span className="text-slate-400">it's our signature.</span>
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-6 text-lg text-slate-600 font-light leading-relaxed"
            >
              <p>
                Founded in the heart of Salem, <strong className="text-slate-900 font-semibold border-b-2 border-blue-500/30">{BRAND.name}</strong> emerged from a simple observation: high-end technology requires high-end understanding.
              </p>
              <p>
                We don't just sell components; we architect experiences. Whether you're a creative professional pushing pixels or a business scaling infrastructure, we ensure your hardware never limits your potential.
              </p>
            </motion.div>

            <div className="pt-8 border-t border-slate-100 flex gap-16">
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-slate-900">100%</span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mt-1">Authentic</span>
              </div>
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-slate-900">24/7</span>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mt-1">Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- OFFERINGS --- */}
      <section id="offerings" className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-20 max-w-2xl">
            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-4 block">What We Do</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">Expertise across the spectrum.</h2>
            <p className="text-xl text-slate-500 font-light">From premium hardware sales to complex technical diagnostics, we provide a unified home for your technology needs.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OFFERINGS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="group bg-white p-8 lg:p-10 rounded-[2rem] border border-slate-100 shadow-[0_5px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.1)] hover:border-blue-100  transition-all duration-300"
              >
                <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-8 
                  group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300"
                >
                  {React.cloneElement(item.icon as React.ReactElement, {
                    size: 24,
                    className: "text-current"
                  })}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TRUST SECTION --- */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              The pillars of our <br />
              <span className="text-blue-600">credibility.</span>
            </h2>
            <p className="text-slate-500 font-light text-lg mb-8 leading-relaxed">
              Technology is an investment. We protect that investment through transparency and relentless quality control.
            </p>
            <div className="h-1 w-20 bg-blue-600 rounded-full" />
          </div>
          
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-x-12 gap-y-16">
            {TRUST_POINTS.map((point, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600 mb-2">
                  {React.cloneElement(point.icon as React.ReactElement, { size: 24 })}
                </div>
                <h4 className="text-xl font-bold text-slate-900">{point.title}</h4>
                <p className="text-slate-500 leading-relaxed">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STORE PRESENCE --- */}
      <section id="store" className="py-12 max-w-7xl mx-auto px-6">
        <div className="relative group rounded-[2.5rem] overflow-hidden bg-black text-white min-h-[500px] flex items-center">
          {/* Overlay Gradient for Image */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/80 to-transparent" />
          
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-60 transition-transform duration-[1.5s] group-hover:scale-110" 
              alt="iTech Computers Store Interior"
            />
          </div>

          <div className="relative z-20 p-6 md:p-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
              Showroom Open
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">Visit our showroom.</h2>
            
            <div className="space-y-8 text-slate-300 font-light mb-12">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-blue-500 mt-1 shrink-0" />
                <p className="text-xl text-white">{BRAND.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Working Hours</div>
                  <div className="text-white text-lg font-medium">Mon–Sat: 9.30AM–9:30PM</div>
                  <div className="text-white text-lg font-medium">Sunday: 9.30AM–5:30PM</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Support</div>
                  <div className="text-white text-lg font-medium">Walk-ins Welcome</div>
                </div>
              </div>
            </div>
            <a
              href="https://www.google.com/maps?ll=11.667667,78.135905&z=15&t=m&hl=en-US&gl=US&cid=5146045816583805650"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-zinc-400 hover:text-white transition-colors group"
            >
              <button className="group/btn flex items-center gap-3 text-white font-bold bg-white/10 hover:bg-white hover:text-black border border-white/20 px-8 py-4 rounded-full transition-all duration-300 backdrop-blur-sm">
                View on Google Maps
                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* --- CONTACT & CTA --- */}
      <section id="contact" className="py-24 md:py-32 max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-b from-white to-blue-50/50 rounded-[3rem] p-8 md:p-16 text-center border border-blue-100 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.1)]">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">Talk to a specialist.</h2>
          <p className="text-lg text-slate-500 font-light mb-12 max-w-2xl mx-auto">
            No automated systems. No scripts. Just honest technical advice from people who care about your setup.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
            <a href={`tel:${BRAND.phone}`} className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PhoneIcon className="w-24 h-24 text-blue-600 -mr-4 -mt-4 transform rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Call Us</div>
                <div className="font-bold text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{BRAND.phone}</div>
              </div>
            </a>

            <a href={`mailto:${BRAND.email}`} className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MailIcon className="w-24 h-24 text-blue-600 -mr-4 -mt-4 transform -rotate-12" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MailIcon className="w-5 h-5" />
                </div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Email Us</div>
                <div className="font-bold text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{BRAND.email}</div>
              </div>
            </a>
          </div>

          <button onClick={() => navigate('/custom-pcs')} className="px-12 py-5 bg-slate-900 text-white rounded-full font-bold text-lg shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-300">
            Start Your Custom Build
          </button>
        </div>
      </section>
    </div>
  );
};

// Simple Icon Wrappers
const PhoneIcon = ({ className }: { className?: string }) => (
  <Phone className={className} />
);

const MailIcon = ({ className }: { className?: string }) => (
  <Mail className={className} />
);

const About: React.FC = () => {
  // ✅ SEO Strings
  const pageTitle = "About iTech Computers | Custom PC Experts in Salem";
  const pageDesc = "Learn about iTech Computers Salem. We specialize in high-end custom gaming PCs, workstations, and authentic computer parts with expert support.";
  const canonicalUrl = "https://itechcomputers.shop/about";

  // ✅ AboutPage Schema
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "ComputerStore",
      "name": "iTech Computers",
      "image": "https://itechcomputers.shop/og-home-banner.jpg",
      "telephone": BRAND.phone, 
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "RBT Mall, Meyyanur Bypass Rd, opp. to iplanet",
        "addressLocality": "Salem",
        "addressRegion": "Tamil Nadu",
        "postalCode": "636004",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        
        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(aboutSchema)}
        </script>
      </Helmet>
      
      <MainContent />
    </>
  );
};

export default About;