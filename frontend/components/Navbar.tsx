import React, { useState, useEffect } from 'react';
import { NavItem } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import CartIcon from './icons/CartIcon';
import UserIcon from './icons/UserIcon';
import MenuIcon from './icons/MenuIcon';
import XIcon from './icons/XIcon';

const navItems: NavItem[] = [
  { label: 'Home', href: '#' },
  {
    label: 'Shop',
    href: '#',
    children: [
      { label: 'Laptops', href: '#' },
      { label: 'Desktops', href: '#' },
      { label: 'Monitors', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Peripherals', href: '#' },
    ],
  },
  {
    label: 'Brands',
    href: '#',
    children: [
      { label: 'Intel', href: '#' },
      { label: 'AMD', href: '#' },
      { label: 'Nvidia', href: '#' },
      { label: 'Logitech', href: '#' },
      { label: 'Corsair', href: '#' },
    ],
  },
  { label: 'PC Builder', href: '#' },
  {
    label: 'Services',
    href: '#',
    children: [
      { label: 'Custom Builds', href: '#' },
      { label: 'Repairs & Upgrades', href: '#' },
      { label: 'Consulting', href: '#' },
    ],
  },
  { label: 'Deals', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
  if (item.children) {
    return (
      <li className="group relative">
        <a
          href={item.href}
          className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors duration-200"
        >
          {item.label}
          <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
        </a>
        <ul className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden hidden group-hover:block z-50 ring-1 ring-black ring-opacity-5">
          {item.children.map((child) => (
            <li key={child.label}>
              <a
                href={child.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <a
        href={item.href}
        className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
      >
        {item.label}
      </a>
    </li>
  );
};

const MobileNavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.children) {
        return (
            <li>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center py-3 text-gray-800 hover:text-blue-600 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`submenu-${item.label}`}
                >
                    <span className="font-semibold">{item.label}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div id={`submenu-${item.label}`} className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                    <ul className="pl-4 pt-2 pb-2 border-l border-gray-200 ml-2">
                        {item.children.map((child) => (
                            <li key={child.label}>
                                <a href={child.href} className="block py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                    {child.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </li>
        );
    }

    return (
        <li>
            <a href={item.href} className="block py-3 text-gray-800 hover:text-blue-600 transition-colors font-semibold">
                {item.label}
            </a>
        </li>
    );
};


const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        {/* === TOP TIER NAVBAR === */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-20 flex justify-between items-center">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <a href="#" className="text-2xl font-bold text-blue-600">
                iTech Computers
              </a>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-grow justify-center px-8">
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  placeholder="Search for components, PCs, and more..."
                  className="pl-12 pr-4 py-2.5 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
                  aria-label="Search products"
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            {/* Right: Icons & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 sm:space-x-5 text-gray-600">
                 <a href="#" className="hover:text-blue-600 transition-colors duration-200" aria-label="Wishlist">
                    <HeartIcon className="w-6 h-6"/>
                </a>
                <a href="#" className="relative hover:text-blue-600 transition-colors duration-200" aria-label="Shopping Cart">
                    <CartIcon className="w-6 h-6"/>
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                </a>
                 <a href="#" className="hover:text-blue-600 transition-colors duration-200" aria-label="User Profile">
                    <UserIcon className="w-6 h-6"/>
                </a>
              </div>

              <button
                  onClick={() => setIsMenuOpen(true)}
                  className="lg:hidden text-gray-700 hover:text-blue-600"
                  aria-label="Open navigation menu"
                  aria-expanded={isMenuOpen}
              >
                  <MenuIcon className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
        
        {/* === BOTTOM TIER NAVBAR (Desktop) & MOBILE SEARCH === */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex h-12 items-center justify-center">
              <ul className="flex items-center space-x-8 font-medium">
                {navItems.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </ul>
            </nav>

            {/* Mobile Search Bar */}
            <div className="lg:hidden py-3">
              <div className="relative">
                <input
                    type="text"
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Search products"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* === MOBILE MENU FLYOUT === */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={`fixed inset-0 z-50 lg:hidden ${!isMenuOpen && 'pointer-events-none'}`}
      >
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        ></div>

        <div
          className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-blue-600">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
                aria-label="Close navigation menu"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="flex flex-col divide-y divide-gray-200">
                {navItems.map((item) => (
                  <MobileNavLink key={item.label} item={item} />
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
