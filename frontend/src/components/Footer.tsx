
import React from 'react';
import TwitterIcon from './icons/TwitterIcon';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';


const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="text-xl font-bold text-blue-400">iTech Computers</h3>
            <p className="mt-4 text-gray-400 text-sm">Your one-stop shop for computer hardware, custom PCs, and tech accessories.</p>
          </div>

          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-300">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Components</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Laptops</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Peripherals</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Deals</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-300">Support</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Track Order</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Returns</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold tracking-wider uppercase text-gray-300">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="font-semibold tracking-wider uppercase text-gray-300">Stay Updated</h4>
            <p className="mt-4 text-gray-400 text-sm">Subscribe to our newsletter for the latest deals and tech news.</p>
            <form className="mt-4 flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} iTech Computers. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-white"><TwitterIcon className="w-6 h-6" /></a>
            <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-white"><FacebookIcon className="w-6 h-6" /></a>
            <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-white"><InstagramIcon className="w-6 h-6" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
