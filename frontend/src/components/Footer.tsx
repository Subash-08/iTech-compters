import { Mail, Phone, MapPin, Shield, Truck, Headphones, CreditCard, Award, Users, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from "../assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Shop Categories (from your navbar Categories)
  const shopCategories = [
    { label: "Gaming Peripherals", href: "/products/category/gaming" },
    { label: "Laptops", href: "/laptops" },
    { label: "PC Builds", href: "/pc-builds" },
    { label: "Pre-Built PC", href: "/prebuilt-pcs" },
    { label: "Custom PC", href: "/custom-pcs" },
    { label: "Computer Components", href: "/products/category/components" },
  ];

  // Brands (from your navbar Brands)
  const popularBrands = [
    { label: "Nvidia", href: "/brands/nvidia" },
    { label: "AMD", href: "/brands/amd" },
    { label: "Intel", href: "/brands/intel" },
    { label: "ASUS", href: "/brands/asus" },
    { label: "MSI", href: "/brands/msi" },
    { label: "Corsair", href: "/brands/corsair" },
    { label: "Logitech", href: "/brands/logitech" },
    { label: "Razer", href: "/brands/razer" },
  ];

  // Customer Service - Updated with correct paths
  const customerService = [
    { label: "Contact Us", href: "/contact", icon: <Headphones className="w-3 h-3" /> },
    { label: "FAQ", href: "/faq", icon: <Users className="w-3 h-3" /> },
    { label: "Shipping Policy", href: "/shipping-policy", icon: <Truck className="w-3 h-3" /> },
    { label: "Return Policy", href: "/refund-policy", icon: <Shield className="w-3 h-3" /> },
    { label: "Warranty", href: "/warranty-policy", icon: <Award className="w-3 h-3" /> },
  ];

  // Company Info
  const companyInfo = [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ];

  // Legal Links - Updated with correct paths and removed unwanted pages
  const legalLinks = [
    { label: "Terms & Conditions", href: "/terms-conditions" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Warranty Policy", href: "/warranty-policy" },
  ];

  // Payment Methods
  const paymentMethods = [
    { name: "Visa", icon: "💳" },
    { name: "Mastercard", icon: "💳" },
    { name: "American Express", icon: "💳" },
    { name: "PayPal", icon: "💰" },
    { name: "Razorpay", icon: "💸" },
    { name: "UPI", icon: "📱" },
    { name: "Net Banking", icon: "🏦" },
    { name: "COD", icon: "📦" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com", color: "hover:bg-blue-600" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com", color: "hover:bg-sky-400" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com", color: "hover:bg-pink-500" },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com", color: "hover:bg-red-600" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com", color: "hover:bg-blue-500" },
  ];

  return (
    <footer className="w-full bg-[#050505] text-white rounded-xl px-2">
      <div className="mx-auto w-full bg-[#050505] text-white relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 py-12 relative z-10">
          
          {/* Top Section: Newsletter & Trust Badges */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12 pb-8 border-b border-white/10">
            
            {/* Newsletter */}
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Stay Updated with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Tech Deals</span>
              </h2>
              <p className="text-zinc-400 mb-6">
                Subscribe to get exclusive offers, new product launches, and tech insights.
              </p>
              
              <form className="w-full max-w-md" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-3 font-medium hover:opacity-90 transition-opacity duration-300"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="text-zinc-600 text-xs mt-2">
                  By subscribing, you agree to our <Link to="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</Link>
                </p>
              </form>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <Truck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-zinc-400">Above ₹9999</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-zinc-400">100% Protected</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <Headphones className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm font-medium">24/7 Support</p>
                <p className="text-xs text-zinc-400">Dedicated Help</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm font-medium">1 Year Warranty</p>
                <p className="text-xs text-zinc-400">On All Products</p>
              </div>
            </div>
          </div>

          {/* Middle Section: Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center">
                 <img src={Logo} alt="NK" className="h-14 w-14 object-contain" />
                </div>
                <div>
                  <span className="font-bold text-2xl tracking-tight block">iTech Computers</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">Premium Electronics</span>
                </div>
              </div>
              
              <p className="text-zinc-400 leading-relaxed max-w-sm text-sm">
                Your trusted destination for premium gaming peripherals, custom PCs, and cutting-edge electronics. Quality products with exceptional service.
              </p>

              <div className="space-y-4">
                <a href="tel:+911234567890" className="flex items-center space-x-3 text-zinc-400 hover:text-white transition-colors group">
                  <div className="p-2 bg-white/5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                    <Phone className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span>+91 12345 67890</span>
                </a>
                <a href="mailto:support@itechcomputers.com" className="flex items-center space-x-3 text-zinc-400 hover:text-white transition-colors group">
                  <div className="p-2 bg-white/5 rounded-full group-hover:bg-purple-500/10 transition-colors">
                    <Mail className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <span>support@itechcomputers.com</span>
                </a>
                <div className="flex items-center space-x-3 text-zinc-400">
                  <div className="p-2 bg-white/5 rounded-full">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>123 Tech Street, Bangalore, India</span>
                </div>
              </div>
            </div>

            {/* Shop Categories */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg pb-2 border-b border-white/10">
                Shop Categories
              </h3>
              <ul className="space-y-3">
                {shopCategories.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href} 
                      className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm py-1"
                    >
                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">›</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Brands */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg pb-2 border-b border-white/10">
                Popular Brands
              </h3>
              <ul className="space-y-3">
                {popularBrands.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href} 
                      className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm py-1"
                    >
                      <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2">›</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg pb-2 border-b border-white/10">
                Customer Service
              </h3>
              <ul className="space-y-3">
                {customerService.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href} 
                      className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm py-1"
                    >
                      <span className="text-green-500">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link 
                    to="/support" 
                    className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm py-1"
                  >
                    <span className="text-yellow-500">
                      <Headphones className="w-3 h-3" />
                    </span>
                    <span>Support Center</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Payment & Social */}
          <div>

            
            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-white/10">
              
              {/* Copyright & Legal */}
              <div className="text-zinc-500 text-sm">
                <p>© {currentYear} iTech Computers. All rights reserved.</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {legalLinks.map((link) => (
                    <Link 
                      key={link.label}
                      to={link.href}
                      className="text-zinc-500 hover:text-white transition-colors text-xs"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-3">
                <span className="text-zinc-500 text-sm mr-2">Follow Us:</span>
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-400 transition-all duration-300 hover:text-white ${social.color}`}
                      aria-label={social.name}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;