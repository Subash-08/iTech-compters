import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NavItem } from '../../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import CartIcon from './icons/CartIcon';
import UserIcon from './icons/UserIcon';
import MenuIcon from './icons/MenuIcon';
import XIcon from './icons/XIcon';
// Redux imports
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/actions/authActions';
// Memoized selectors - ADD PROFILE SELECTORS
import {
  selectIsAuthenticated,
  selectUser,
  selectUserInitials
} from '../../src/redux/selectors/index';
import {
  selectProfile,
  selectProfileInitials,
  selectUserName,
  selectUserAvatar
} from '../../src/redux/selectors/index'; // ADD THESE

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/products',
    children: [
      { label: 'Laptops', href: '/products/category/laptops' },
      { label: 'Desktops', href: '/products/category/desktops' },
      { label: 'Monitors', href: '/products/category/monitors' },
      { label: 'Components', href: '/products/category/components' },
      { label: 'Peripherals', href: '/products/category/peripherals' },
    ],
  },
  {
    label: 'Brands',
    href: '/brands',
    children: [
      { label: 'Intel', href: '/brands/intel' },
      { label: 'AMD', href: '/brands/amd' },
      { label: 'Nvidia', href: '/brands/nvidia' },
      { label: 'Logitech', href: '/brands/logitech' },
      { label: 'Corsair', href: '/brands/corsair' },
    ],
  },
  { label: 'PC Builder', href: '/pc-builder' },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Custom Builds', href: '/services/custom-builds' },
      { label: 'Repairs & Upgrades', href: '/services/repairs' },
      { label: 'Consulting', href: '/services/consulting' },
    ],
  },
  { label: 'Deals', href: '/deals' },
  { label: 'Blog', href: '/blog' },
  { label: 'Support', href: '/support' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
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

// Common user menu items configuration for consistency
const getUserMenuItems = (userRole?: string) => [
  { label: 'My Profile', href: '/profile', icon: 'user' },
  { label: 'My Orders', href: '/orders', icon: 'orders' },
  { label: 'Wishlist', href: '/wishlist', icon: 'heart' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
  ...(userRole === 'admin' ? [{ label: 'Admin Dashboard', href: '/admin', icon: 'admin' }] : []),
];

// Helper function to get avatar URL
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return null;
  
  // If avatar is already a full URL, use it directly
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Otherwise, construct the full URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${avatarPath}`;
};

// User Dropdown Component
const UserDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const user = useAppSelector(selectUser);
    const userInitials = useAppSelector(selectUserInitials);
    
    // ADD PROFILE SELECTORS
    const profile = useAppSelector(selectProfile);
    const profileInitials = useAppSelector(selectProfileInitials);
    const profileName = useAppSelector(selectUserName);
    const profileAvatar = useAppSelector(selectUserAvatar);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use profile data if available, otherwise fall back to auth data
    const displayUser = profile || user;
    const displayInitials = profileInitials || userInitials;
    const displayName = profileName || user?.firstName;
    const displayAvatar = profileAvatar || user?.avatar;
    const avatarUrl = getAvatarUrl(displayAvatar);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // If not authenticated, show login link
    if (!isAuthenticated) {
        return (
            <Link 
                to="/login" 
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
                aria-label="Sign in"
            >
                <UserIcon className="w-6 h-6"/>
                <span className="hidden md:block text-sm font-medium">Sign In</span>
            </Link>
        );
    }

    const userMenuItems = getUserMenuItems(displayUser?.role);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Avatar Button */}
            <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                <div className="flex items-center space-x-2">
                    {/* User Avatar */}
                    {avatarUrl ? (
                        <img
                            className="h-8 w-8 rounded-full object-cover border border-gray-200"
                            src={avatarUrl}
                            alt="User avatar"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-200">
                            <span className="text-white text-sm font-medium">
                                {displayUser?.firstName}
                            </span>
                        </div>
                    )}
                    
                    {/* User Name (visible on larger screens) */}
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                        {displayUser?.firstName || 'User'}
                    </span>
                    
                    {/* Chevron Icon */}
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            
            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-xl rounded-lg border border-gray-200 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {displayUser?.firstName} {displayUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                            {displayUser?.email}
                        </p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                        {userMenuItems.map((item) => (
                            <Link 
                                key={item.label}
                                to={item.href} 
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.icon === 'user' && <UserIcon className="w-4 h-4 mr-3" />}
                                {item.icon === 'orders' && (
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                )}
                                {item.icon === 'heart' && <HeartIcon className="w-4 h-4 mr-3" />}
                                {item.icon === 'settings' && (
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                {item.icon === 'admin' && (
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    </svg>
                                )}
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Mobile User Menu Component
const MobileUserMenu: React.FC = () => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const user = useAppSelector(selectUser);
    const userInitials = useAppSelector(selectUserInitials);
    
    // ADD PROFILE SELECTORS
    const profile = useAppSelector(selectProfile);
    const profileInitials = useAppSelector(selectProfileInitials);
    const profileName = useAppSelector(selectUserName);
    const profileAvatar = useAppSelector(selectUserAvatar);

    // Use profile data if available, otherwise fall back to auth data
    const displayUser = profile || user;
    const displayInitials = profileInitials || userInitials;
    const displayName = profileName || user?.firstName;
    const displayAvatar = profileAvatar || user?.avatar;
    const avatarUrl = getAvatarUrl(displayAvatar);

    const handleLogout = () => {
        dispatch(logout());
        document.body.style.overflow = 'auto';
    };

    const closeMenu = () => {
        document.body.style.overflow = 'auto';
    };

    const userMenuItems = getUserMenuItems(displayUser?.role);

    if (!isAuthenticated) {
        return (
            <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">Welcome</div>
                        <div className="text-sm font-medium text-gray-500">Sign in to your account</div>
                    </div>
                </div>
                <div className="mt-3 space-y-1">
                    <Link
                        to="/login"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={closeMenu}
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={closeMenu}
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                    {avatarUrl ? (
                        <img
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            src={avatarUrl}
                            alt="User avatar"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-200">
                            <span className="text-white text-sm font-medium">
                                {displayUser?.firstName}
                            </span>
                        </div>
                    )}
                </div>
                <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                        {displayUser?.firstName} {displayUser?.lastName}
                    </div>
                    <div className="text-sm font-medium text-gray-500">{displayUser?.email}</div>
                </div>
            </div>
            <div className="mt-3 space-y-1">
                {userMenuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.href}
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={closeMenu}
                    >
                        {item.label}
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border-t border-gray-200"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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
              <Link to="/" className="text-2xl font-bold text-blue-600">
                iTech Computers
              </Link>
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
                {/* Wishlist */}
                <Link to="/wishlist" className="hover:text-blue-600 transition-colors duration-200" aria-label="Wishlist">
                  <HeartIcon className="w-6 h-6"/>
                </Link>
                
                {/* Cart */}
                <Link to="/cart" className="relative hover:text-blue-600 transition-colors duration-200" aria-label="Shopping Cart">
                  <CartIcon className="w-6 h-6"/>
                  {/* Cart count can be added here */}
                </Link>
                
                {/* User dropdown - handles both authenticated and guest states */}
                <UserDropdown />
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
            
            {/* Mobile User Menu */}
            <MobileUserMenu />
            
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