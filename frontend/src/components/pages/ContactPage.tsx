import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  ShoppingBag, RefreshCw, Wrench, Headphones, 
  CreditCard, Truck, ChevronRight, HelpCircle,
  Send, CheckCircle, AlertCircle, ExternalLink,
  MessageCircle, Smartphone, Map, Navigation,
  ChevronDown, ChevronUp, Home, MessageCircleMore
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  // State for form
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
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
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({
          fullName: '',
          email: '',
          mobile: '',
          subject: '',
          message: ''
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000);
      }, 1500);
    } else {
      setErrors(validationErrors);
    }
  };

  // FAQ Data
  const faqs = [
    {
      id: 1,
      question: "What are your shipping options and delivery times?",
      answer: "We offer standard (5-7 business days), express (2-3 business days), and overnight shipping. Most metro areas receive deliveries within the estimated timeframe. You'll receive tracking information as soon as your order ships."
    },
    {
      id: 2,
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive an email with your tracking number. You can also track your order by logging into your account and visiting the 'Order History' section."
    },
    {
      id: 3,
      question: "What is your return and refund policy?",
      answer: "We offer a 30-day return policy for unused items in original packaging. Refunds are processed within 5-7 business days after we receive the returned item. Some products may have different return policies as noted on their product pages."
    },
    {
      id: 4,
      question: "Do you offer international shipping?",
      answer: "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by destination. You can calculate shipping costs at checkout before completing your order."
    },
    {
      id: 5,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and select country-specific payment methods. All transactions are secured with 256-bit SSL encryption."
    }
  ];

  // Support Categories
  const supportCategories = [
    {
      id: 1,
      title: "Order Status",
      icon: ShoppingBag,
      description: "Track your order, check delivery status",
      link: "/orders"
    },
    {
      id: 2,
      title: "Returns & Refunds",
      icon: RefreshCw,
      description: "Start a return or check refund status",
      link: "/returns"
    },
    {
      id: 3,
      title: "Warranty / Repair",
      icon: Wrench,
      description: "Product warranty claims and repairs",
      link: "/warranty"
    },
    {
      id: 4,
      title: "Technical Support",
      icon: Headphones,
      description: "Product setup and technical assistance",
      link: "/support"
    },
    {
      id: 5,
      title: "Payment & Billing",
      icon: CreditCard,
      description: "Billing inquiries and payment issues",
      link: "/billing"
    },
    {
      id: 6,
      title: "Shipping & Delivery",
      icon: Truck,
      description: "Shipping options and delivery times",
      link: "/shipping"
    }
  ];

  // Contact Methods
  const contactMethods = [
    {
      id: 1,
      type: "phone",
      title: "Support Phone",
      value: "+1 (800) 123-4567",
      icon: Phone,
      action: "tel:+18001234567",
      subtitle: "Available 24/7 for urgent issues"
    },
    {
      id: 2,
      type: "email",
      title: "Support Email",
      value: "support@itechcomputers.com",
      icon: Mail,
      action: "mailto:support@itechcomputers.com",
      subtitle: "Response within 4 business hours"
    },
    {
      id: 3,
      type: "address",
      title: "Headquarters",
      value: "123 Tech Avenue, San Francisco, CA 94107",
      icon: MapPin,
      action: "https://maps.google.com",
      subtitle: "Visit our flagship store"
    },
    {
      id: 4,
      type: "hours",
      title: "Working Hours",
      value: "Mon - Fri: 9 AM - 8 PM\nSat - Sun: 10 AM - 6 PM",
      icon: Clock,
      subtitle: "All times in Pacific Time"
    }
  ];

  // Social Media
  const socialMedia = [
    { name: "Twitter", icon: "𝕏", color: "hover:bg-black/10", link: "https://twitter.com" },
    { name: "Facebook", icon: "f", color: "hover:bg-blue-600/10", link: "https://facebook.com" },
    { name: "Instagram", icon: "📷", color: "hover:bg-pink-600/10", link: "https://instagram.com" },
    { name: "LinkedIn", icon: "in", color: "hover:bg-blue-700/10", link: "https://linkedin.com" }
  ];

  // Live Chat Options
  const liveChatOptions = [
    {
      id: 1,
      title: "Live Chat",
      icon: MessageCircle,
      description: "Chat with our support team",
      color: "bg-blue-500 hover:bg-blue-600",
      link: "#chat"
    },
    {
      id: 2,
      title: "WhatsApp",
      icon: MessageCircleMore,
      description: "Message us on WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      link: "https://wa.me/18001234567"
    },
    {
      id: 3,
      title: "Call Now",
      icon: Smartphone,
      description: "Click to call support",
      color: "bg-purple-500 hover:bg-purple-600",
      link: "tel:+18001234567"
    }
  ];

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Auto-expand textarea
  const handleTextareaChange = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    handleInputChange(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/50">
 

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
            Get in <span className="font-semibold text-blue-600">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about our products, services, or need technical support? 
            Our team is here to help you with exceptional service.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column - Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                {contactMethods.map((method) => (
                  <a
                    key={method.id}
                    href={method.action}
                    rel="noopener noreferrer"
                    className="group flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <method.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{method.title}</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{method.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{method.subtitle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Follow Us</h3>
                <div className="flex space-x-3">
                  {socialMedia.map((social) => (
                    <a
                      key={social.name}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-300 hover:scale-105 ${social.color}`}
                      aria-label={social.name}
                    >
                      <span className="text-lg font-medium">{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Quick Help
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {supportCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Link
                      key={category.id}
                      to={category.link}
                      className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                            {category.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {isSubmitted ? (
                <div className="text-center py-12 animate-fade-up">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    Thank you for reaching out. Our support team will get back to you within 24 hours. We've sent a confirmation email to {formData.email}.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Send Another Message
                    <Send className="w-4 h-4 ml-2" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Send us a Message</h2>
                      <p className="text-gray-600 mt-2">
                        Fill out the form below and we'll respond as soon as possible
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span>Average response time: 4 hours</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-all duration-300`}
                          placeholder="John Doe"
                        />
                        {errors.fullName && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-all duration-300`}
                          placeholder="john@example.com"
                        />
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Mobile */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border ${errors.mobile ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-all duration-300`}
                          placeholder="+1 (123) 456-7890"
                        />
                        {errors.mobile && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.mobile}
                          </p>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject *
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl border ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-all duration-300`}
                          placeholder="How can we help?"
                        />
                        {errors.subject && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.subject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleTextareaChange}
                        rows="4"
                        className={`w-full px-4 py-3 rounded-xl border ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-all duration-300 resize-none`}
                        placeholder="Please describe your inquiry in detail..."
                      />
                      {errors.message && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-3">
                        By submitting this form, you agree to our Privacy Policy and Terms of Service.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Live Chat Widgets */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Immediate Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {liveChatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <a
                      key={option.id}
                      href={option.link}
                      className={`${option.color} text-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group`}
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold mb-2">{option.title}</h4>
                      <p className="text-sm opacity-90">{option.description}</p>
                      <div className="mt-4 text-sm font-medium opacity-90 group-hover:translate-x-1 transition-transform">
                        Start Now →
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-light text-gray-900">Frequently Asked Questions</h2>
              <p className="text-gray-600 mt-2">Quick answers to common questions</p>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View All FAQs
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-6">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                  )}
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    expandedFaq === faq.id ? 'max-h-96 mt-4' : 'max-h-0'
                  }`}
                >
                  <div className="pl-12">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-light text-gray-900">Visit Our Store</h2>
              <p className="text-gray-600 mt-2">Experience our products in person</p>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Map Placeholder */}
              <div className="lg:col-span-2 h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Interactive Map Integration</p>
                  <p className="text-sm text-gray-500 mt-1">Google Maps / Mapbox</p>
                </div>
              </div>
              
              {/* Store Info */}
              <div className="p-8 bg-gradient-to-b from-white to-gray-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Flagship Store</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Address</h4>
                      <p className="text-gray-600 mt-1">
                        123 Tech Avenue<br />
                        San Francisco, CA 94107<br />
                        United States
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Store Hours</h4>
                      <p className="text-gray-600 mt-1 whitespace-pre-line">
                        Monday - Friday: 10 AM - 8 PM
                        Saturday: 10 AM - 6 PM
                        Sunday: 11 AM - 5 PM
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Phone className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Store Phone</h4>
                      <a href="tel:+14151234567" className="text-gray-600 hover:text-blue-600 transition-colors mt-1 block">
                        +1 (415) 123-4567
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Pulse Animation */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          
          <a
            href="#chat"
            className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            aria-label="Open live chat"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </a>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Live Chat Support
              <div className="absolute top-full right-3 -mt-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;