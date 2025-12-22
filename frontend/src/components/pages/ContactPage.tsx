import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, 
  RefreshCw, Wrench, Headphones, 
  ShoppingBag, ChevronDown, ChevronUp, 
  MessageCircleMore, Navigation, Send, 
  CheckCircle, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // --- Company Information ---
  const companyDetails = {
    name: "iTech Computers",
    phone: "6382928973",
    email: "itechcomputersno7@gmail.com",
    address: "iTech Computers, RBT Mall, Meyyanur Bypass Rd, opp. to iplanet, Meyyanur, Salem, Tamil Nadu 636004",
    mapLink: "https://share.google/MplrTsc7xLxMCO0Z4" // General link or specific place ID
  };

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      // Simulate API submission
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({ fullName: '', email: '', mobile: '', subject: '', message: '' });
        setTimeout(() => setIsSubmitted(false), 5000);
      }, 1500);
    } else {
      setErrors(validationErrors);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // --- Data & Config ---
  const contactMethods = [
    {
      id: 1,
      type: "phone",
      title: "Call Us",
      value: `+91 ${companyDetails.phone}`,
      icon: Phone,
      action: `tel:+91${companyDetails.phone}`,
      subtitle: "Mon-Sat: 10AM - 9PM",
      color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
    },
    {
      id: 2,
      type: "email",
      title: "Email Support",
      value: companyDetails.email,
      icon: Mail,
      action: `mailto:${companyDetails.email}`,
      subtitle: "We reply within 24 hours",
      color: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
    },
    {
      id: 3,
      type: "address",
      title: "Visit Showroom",
      value: "RBT Mall, Meyyanur Bypass Rd, Salem",
      icon: MapPin,
      action: companyDetails.mapLink,
      subtitle: "Get Directions",
      color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
    }
  ];

  const supportCategories = [
    { id: 1, title: "Order Tracking", icon: ShoppingBag, desc: "Check delivery status", link: "/orders" },
    { id: 2, title: "Service Request", icon: Wrench, desc: "Book a repair/service", link: "/service" },
    { id: 3, title: "Warranty Claims", icon: RefreshCw, desc: "Register or claim warranty", link: "/warranty" },
    { id: 4, title: "Tech Support", icon: Headphones, desc: "Troubleshooting help", link: "/support" }
  ];

  const faqs = [
{
  id: 1,
  question: "Do you test the PC before delivery?",
  answer: "Yes. Every PC undergoes full assembly testing, thermal checks, and basic stress tests to ensure stable performance before dispatch."
},

    {
      id: 2,
      question: "Do you provide on-site service for desktops and laptops?",
      answer: "Yes, we provide on-site support for business clients and home users within a 10km radius of our Meyyanur showroom."
    },
    {
      id: 3,
      question: "Can I pick up my online order from the store?",
      answer: "Absolutely! Select 'Store Pickup' at checkout. We'll notify you when your order is ready at our RBT Mall location."
    }
  ];

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-5">
            We're here to help
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Get in Touch with <span className="text-blue-600">iTech</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Need a custom PC build, laptop repair, or enterprise solutions? 
            Our team at RBT Mall, Salem is ready to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        
        {/* Contact Method Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <a
                key={method.id}
                href={method.action}
                target={method.type === 'address' ? '_blank' : '_self'}
                rel="noreferrer"
                className="group bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200 hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300 shadow-sm ${method.color.split(' ')[0]} ${method.color.split(' ')[1].replace('group-hover:', '')}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 font-medium mb-1 w-full px-2 break-words">{method.value}</p>
                <p className="text-sm text-gray-400 font-medium">{method.subtitle}</p>
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-20">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200 overflow-hidden">
              <div className="p-8 lg:p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                  <p className="text-gray-500 mt-2">Fill out the form below and our team will get back to you within 24 hours.</p>
                </div>

                {isSubmitted ? (
                  <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-200">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h3>
                    <p className="text-gray-600 max-w-xs mx-auto mb-8">
                      Thanks for reaching out! We've received your message and will respond shortly.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-sm"
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:bg-blue-50/30 transition-all duration-200 outline-none shadow-sm ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                          placeholder="John Doe"
                        />
                        {errors.fullName && <p className="text-xs text-red-600 flex items-center font-medium mt-1"><AlertCircle size={12} className="mr-1"/>{errors.fullName}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Phone Number</label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:bg-blue-50/30 transition-all duration-200 outline-none shadow-sm ${errors.mobile ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                          placeholder="98765 43210"
                        />
                        {errors.mobile && <p className="text-xs text-red-600 flex items-center font-medium mt-1"><AlertCircle size={12} className="mr-1"/>{errors.mobile}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:bg-blue-50/30 transition-all duration-200 outline-none shadow-sm ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-xs text-red-600 flex items-center font-medium mt-1"><AlertCircle size={12} className="mr-1"/>{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:bg-blue-50/30 transition-all duration-200 outline-none shadow-sm ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                        placeholder="Inquiry about..."
                      />
                      {errors.subject && <p className="text-xs text-red-600 flex items-center font-medium mt-1"><AlertCircle size={12} className="mr-1"/>{errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="4"
                        className={`w-full px-4 py-3.5 rounded-xl border bg-white focus:bg-blue-50/30 transition-all duration-200 outline-none resize-none shadow-sm ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                        placeholder="How can we help you today?"
                      />
                      {errors.message && <p className="text-xs text-red-600 flex items-center font-medium mt-1"><AlertCircle size={12} className="mr-1"/>{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-md hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={20} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links & Map */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Support</h3>
              <div className="grid grid-cols-2 gap-4">
                {supportCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link 
                      key={cat.id} 
                      to={cat.link}
                      className="p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md transition-all duration-200 group text-left bg-gray-50/30"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div className="font-bold text-gray-900 text-sm group-hover:text-blue-700">{cat.title}</div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{cat.desc}</div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Store Location Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200 group">
              <div className="h-56 bg-gray-100 relative overflow-hidden">
                 {/* Decorative background representing map area */}
                 <div className="absolute inset-0 flex items-center justify-center bg-[url('https://www.google.com/maps/vt/data=lyr=m@113&hl=en&x=0&y=0&z=15&s=Galileo')] bg-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                 </div>
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
<iframe
  src="https://www.google.com/maps?q=iTech+Computers+Salem&output=embed"
  className="w-full h-full border-0"
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
                                      
                 </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">iTech Computers</h4>
                    <p className="text-gray-600 text-sm leading-relaxed mt-1 font-medium">
                      {companyDetails.address}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Monday - Saturday</span>
                    <span className="text-gray-900 font-bold">9:30 AM - 9:30 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Sunday</span>
                    <span className="text-gray-900 font-bold">9:30 AM - 5:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 mt-3 font-medium">Quick answers to common questions regarding our services</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`bg-white rounded-2xl transition-all duration-300 border ${expandedFaq === faq.id ? 'border-blue-200 shadow-lg ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className={`font-bold text-lg ${expandedFaq === faq.id ? 'text-blue-600' : 'text-gray-900'}`}>
                    {faq.question}
                  </span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div 
                  className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === faq.id ? 'max-h-40 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;