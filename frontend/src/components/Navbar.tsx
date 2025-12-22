import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavItem } from '../../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import CartIcon from './icons/CartIcon';
import UserIcon from './icons/UserIcon';
import MenuIcon from './icons/MenuIcon';
import XIcon from './icons/XIcon';
import logo from '../assets/logo.png'
import nav1 from '../assets/10014.webp';
import nav2 from '../assets/10016.webp';

// Redux imports
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/actions/authActions';
// Memoized selectors
import {
  selectIsAuthenticated,
  selectUser,
  selectUserInitials,
  selectCartItemsCount,
  selectCartTotal,
  selectWishlistItemsCount

} from '../../src/redux/selectors/index';
import {
  selectProfile,
  selectProfileInitials,
  selectUserName,
  selectUserAvatar
} from '../../src/redux/selectors/index';
import { baseURL } from './config/config';
import SearchBar from './home/SearchBar';
import api from '../components/config/axiosConfig';
import { AlertTriangle, ArrowRight, ChevronDown, ChevronRight, LogOut } from 'lucide-react';

// Types for fetched data
interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  image?: string;
  productCount?: number;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo: {
    url: string | null;
    altText: string | null;
    publicId: string | null;
  };
  productCount?: number;
}

// Updated navItems structure - will be populated dynamically
let navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Categories',
    href: '/categories',
    children: [] // Will be populated with categories from API
  },
  {
    label: 'Brands', 
    href: '/brands',
    children: [] // Will be populated with brands from API
  },
  { label: 'Pre-Built PC', href: '/prebuilt-pcs' },
];

// Updated AuthenticatedUserSection Component with Profile Button
const AuthenticatedUserSection: React.FC<{ closeMobileMenu: () => void }> = ({ closeMobileMenu }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const profileAvatar = useAppSelector(selectUserAvatar);
  
  const [imageError, setImageError] = useState(false);
  
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for modal
  
  const displayUser = profile || user;
  const displayAvatar = profileAvatar || user?.avatar;
  const avatarUrl = getAvatarUrl(displayAvatar);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const userInitials = `${displayUser?.firstName?.charAt(0) || 'U'}${displayUser?.lastName?.charAt(0) || ''}`;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutConfirm(false);
    closeMobileMenu();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  return (
    <div className="p-4 border-t border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between">
        {/* Left: Profile Info */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Profile Photo */}
          {avatarUrl && !imageError ? (
            <img
              className="h-10 w-10 rounded-full object-cover border border-gray-300"
              src={avatarUrl}
              alt={`${displayUser?.firstName || 'User'} avatar`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#544D89] flex items-center justify-center border border-gray-300">
              <span className="text-white text-sm font-medium">
                {userInitials}
              </span>
            </div>
          )}
          
          {/* User Name */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">
              {displayUser?.firstName} {displayUser?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {displayUser?.email}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-2 ml-3">
          {/* Profile Button */}
          <Link
            to="/profile"
            className="flex items-center justify-center w-9 h-9 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-[#544D89] hover:text-white transition-colors shadow-sm"
            onClick={closeMobileMenu}
            aria-label="My Profile"
            title="My Profile"
          >
            <UserIcon className="w-5 h-5" />
          </Link>

{/* Admin Dashboard - Only for admins */}
          {displayUser?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
              onClick={closeMobileMenu}
              aria-label="Admin dashboard"
              title="Admin Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </Link>
          )}
          
          {/* Sign Out Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center w-9 h-9 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm"
            aria-label="Sign out"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal (Mobile) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Out?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to sign out of your account? You will need to sign in again to access your profile.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex gap-3 sm:px-6">
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isCategories = item.label === 'Categories';
  const isBrands = item.label === 'Brands';
  const isMegaMenu = isCategories || isBrands;
  const navigate = useNavigate();
  // Logic: Group items into columns
  let groupedItems: NavItem[][] = [];
  if (isMegaMenu && hasChildren) {
    const columns = 4;
    const itemsPerColumn = Math.ceil(item.children!.length / columns);
    for (let i = 0; i < columns; i++) {
      groupedItems.push(
        item.children!.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
      );
    }
  }

// --- MEGA MENU RENDERER ---
  if (isMegaMenu) {
    return (
      // 1. CHANGED: Removed 'relative', added 'static'. 
      // This allows the dropdown to position itself relative to the Header, not this specific list item.
      <li className="group static h-full flex items-center">
        
        {/* Top Level Nav Item */}
        <Link
          to={item.href}
          className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium text-black transition-all duration-300 hover:text-[#544D89] hover:bg-[#544D89]/5"
        >
          {item.label}
          <ChevronDown 
            className="w-3.5 h-3.5 mt-0.5 text-black transition-transform duration-300 ease-out group-hover:rotate-180 group-hover:text-[#544D89]" 
            strokeWidth={2}
          />
        </Link>

        {/* Mega Dropdown Container */}
        {/* 2. CHANGED: 
            - 'left-0 w-full': Spans the entire width of the header.
            - 'flex justify-center': Centers the card horizontally in the middle of the screen.
            - 'top-full': Starts exactly at the bottom of the header.
        */}
        <div className="absolute top-full left-0 w-full flex justify-center opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) z-50">
          
          {/* Main Card */}
          {/* 3. CHANGED: Controls the actual width of the menu card */}
          <div className="w-[95vw] lg:w-[900px] xl:w-[1100px] bg-white rounded-b-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex mx-auto mt-2">
            
            {/* Left Side: Links Grid */}
            <div className={`flex-1 p-6 xl:p-8 w-full xl:w-3/4`}>
              
              {/* Optional Section Header */}
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2c2358]">
                  Browse {item.label}
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-x-4 lg:gap-x-8 gap-y-6">
                {groupedItems.map((columnItems, columnIndex) => (
                  <div key={columnIndex} className="flex flex-col space-y-1">
                    {columnItems.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        className="group/item flex items-center justify-between text-[13px] lg:text-[14px] text-black hover:text-[#00e2e8] transition-colors py-1.5"
                      >
                        <span className="transition-transform duration-200 group-hover/item:translate-x-1 truncate">
                          {child.label}
                        </span>
                        {/* Only show icon on hover */}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 text-[#00e2e8]" />
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Promo / Hero Card */}
            <div className="hidden xl:block w-[320px] bg-gray-50 p-3 border-l border-gray-100">
                <div className="relative w-full h-[380px] rounded-xl overflow-hidden group/ad isolate cursor-pointer">
                  {/* Image with Zoom Effect */}
<img 
  // ✅ Correct: Pass the variable directly
  src={isCategories ? nav1 : nav2}
  alt="Featured Collection" 
  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/ad:scale-105"
/>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <p className="text-white/80 text-xs font-medium mb-2 tracking-wide">
                      {isCategories ? "New Arrivals" : "Official Partners"}
                    </p>
                    <h4 className="text-white font-semibold text-xl mb-4 leading-tight">
                    {isCategories ? "Premium Laptops." : "Custom PC Builder."}
                    </h4>
                    
                    <button   onClick={() => navigate(isCategories ? '/products/category/laptops' : '/custom-pcs')} className="flex items-center gap-2 text-white text-xs font-semibold backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2.5 rounded-lg transition-all w-fit group-hover/ad:gap-3">
                     {isCategories ? "Shop Laptops" : "Start Building"}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
            </div>
            
          </div>
        </div>
      </li>
    );
  }

  // --- STANDARD DROPDOWN RENDERER ---
  return (
    <li className="group relative h-full flex items-center">
      <Link
        to={item.href}
        className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium text-black transition-all duration-300 hover:text-[#544D89] hover:bg-[#544D89]/5"
      >
        {item.label}
        {hasChildren && (
          <ChevronDown 
            className="w-3.5 h-3.5 mt-0.5 text-black transition-transform duration-300 ease-out group-hover:rotate-180 group-hover:text-[#544D89]" 
            strokeWidth={2}
          />
        )}
      </Link>

      {/* Standard Floating Dropdown */}
      {hasChildren && (
        <div className="absolute top-[calc(100%+0.25rem)] left-0 w-56 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out z-50">
          <div className="bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 overflow-hidden">
            {item.children!.map((child) => (
              <Link
                key={child.label}
                to={child.href}
                className="flex items-center justify-between px-5 py-2.5 text-[15px] text-gray-600 hover:text-[#544D89] hover:bg-gray-50 transition-colors group/item"
              >
                <span>{child.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 text-[#544D89]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

interface MobileNavLinkProps {
  item: NavItem;
  closeMenu: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ item, closeMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to get children regardless of if they are nested in groups (from desktop logic) or flat
  // In the Navbar component, item.children is NavItem[], which is flat. 
  // We can render directly.

  if (item.children && item.children.length > 0) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex justify-between items-center py-3.5 px-4 text-left transition-colors ${isOpen ? 'bg-gray-50 text-[#544D89]' : 'text-gray-800 hover:text-[#544D89]'}`}
          aria-expanded={isOpen}
          aria-controls={`submenu-${item.label}`}
        >
          <span className="font-semibold text-[15px]">{item.label}</span>
          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180 text-[#544D89]' : ''}`} />
        </button>
        {/* FIX: Increased max-height to 2000px to allow full scroll, added overflow-hidden to prevent layout jump during transition */}
        <div 
          id={`submenu-${item.label}`} 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <ul className="bg-gray-50 pb-2">
            {item.children.map((child) => (
              <li key={child.label}>
                <Link 
                  to={child.href} 
                  className="flex items-center justify-between py-2.5 px-6 pl-8 text-[14px] text-gray-600 hover:text-[#544D89] hover:bg-gray-100 transition-colors border-l-2 border-transparent hover:border-[#544D89]"
                  onClick={closeMenu}
                >
                  {child.label}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link 
        to={item.href} 
        className="block py-3.5 px-4 text-[15px] text-gray-800 hover:text-[#544D89] hover:bg-gray-50 transition-colors font-semibold"
        onClick={closeMenu}
      >
        {item.label}
      </Link>
    </li>
  );
};

// Common user menu items configuration
const getUserMenuItems = (userRole?: string) => [
  { label: 'My Profile', href: '/profile', icon: 'user' },
  { label: 'My Orders', href: '/account/orders', icon: 'orders' },
  ...(userRole === 'admin' ? [{ label: 'Admin Dashboard', href: '/admin', icon: 'admin' }] : []),
];

// Fixed avatar URL function
const getAvatarUrl = (avatarPath?: string): string | null => {
  if (!avatarPath) return null;
  
  // If avatar is already a full URL, use it directly
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Otherwise, construct the full URL
  const baseUrl = import.meta.env.VITE_API_URL || baseURL;
  if (!baseUrl) {
    console.warn('Base URL not configured');
    return null;
  }
  
  // Ensure proper URL construction
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanAvatarPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${cleanBaseUrl}${cleanAvatarPath}`;
};

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // State for modal
  
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  
  // Profile selectors
  const profile = useAppSelector(selectProfile);
  const profileAvatar = useAppSelector(selectUserAvatar);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use profile data if available, otherwise fall back to auth data
  const displayUser = profile || user;
  const displayAvatar = profileAvatar || user?.avatar;
  const avatarUrl = getAvatarUrl(displayAvatar);

  // Reset image error when avatar changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the modal
      if (showLogoutConfirm) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutConfirm]); // Added dependency

  const handleLogoutClick = () => {
    setIsOpen(false); // Close dropdown first
    setShowLogoutConfirm(true); // Open modal
  };

  const confirmLogout = () => {
    dispatch(logout());
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setImageError(false); // Reset error state when reopening
  };

  // If not authenticated, show login link
  if (!isAuthenticated) {
    return (
      <Link 
        to="/login" 
        className="flex items-center space-x-2 text-black hover:text-[#544D89] transition-colors duration-200 px-3 py-2 rounded-md"
        aria-label="Sign in"
      >
        <UserIcon className="w-6 h-6"/>
        <span className="hidden md:block text-sm font-medium">Sign In</span>
      </Link>
    );
  }

  const userMenuItems = getUserMenuItems(displayUser?.role);
  const userInitials = `${displayUser?.firstName?.charAt(0) || 'U'}${displayUser?.lastName?.charAt(0) || ''}`;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Avatar Button */}
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 text-black hover:text-[#544D89] transition-colors duration-200 focus:outline-none px-2 py-2 rounded-md group"
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          <div className="flex items-center space-x-2">
            {/* User Avatar */}
            {avatarUrl && !imageError ? (
              <img
                className="h-8 w-8 rounded-full object-cover border border-gray-200 group-hover:border-[#544D89] transition-colors"
                src={avatarUrl}
                alt={`${displayUser?.firstName || 'User'} avatar`}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#544D89] flex items-center justify-center border border-gray-200">
                <span className="text-white text-xs font-bold">
                  {userInitials}
                </span>
              </div>
            )}
            
            {/* User Name (visible on larger screens) */}
            <span className="hidden md:block text-sm font-medium text-black max-w-24 truncate">
              {displayUser?.firstName || 'User'}
            </span>
            
            {/* Chevron Icon */}
            <ChevronDownIcon className={`w-4 h-4 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white shadow-2xl rounded-xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5">
            {/* User Info Section */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-sm font-bold text-gray-900 truncate">
                {displayUser?.firstName} {displayUser?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {displayUser?.email}
              </p>
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              {userMenuItems.map((item) => (
                <Link 
                  key={item.label}
                  to={item.href} 
                  className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-[#544D89]/5 hover:text-[#544D89] transition-colors duration-200 group"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon === 'user' && <UserIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#544D89]" />}
                  {item.icon === 'orders' && (
                    <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#544D89]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )}
                  {item.icon === 'heart' && <HeartIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#544D89]" />}
                  {item.icon === 'admin' && (
                    <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#544D89]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  )}
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={handleLogoutClick}
                className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal (Desktop) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Out?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to sign out?
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex gap-3 sm:px-6">
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                onClick={confirmLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const cartCount = useAppSelector(selectCartItemsCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const wishlistCount = useAppSelector(selectWishlistItemsCount);

  // Format cart total to Indian Rupees
  const formattedCartTotal = React.useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cartTotal);
  }, [cartTotal]);

  // Fetch categories and brands data
  const fetchNavData = async () => {
    try {
      setLoading(true);
      setError('');

      const [categoriesRes, brandsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
      ]);

      const categoriesData = categoriesRes.data;
      const brandsData = brandsRes.data;

      setCategories(categoriesData.categories || categoriesData || []);
      setBrands(brandsData.brands || brandsData || []);
    } catch (err) {
      console.error('Error fetching navigation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch navigation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavData();
  }, []);

  // Update navItems with fetched data
  const updatedNavItems = React.useMemo(() => {
    const categoryItems = categories.map(category => ({
      label: category.name,
      href: `/products/category/${category.slug}`
    }));

    const brandItems = brands.map(brand => ({
      label: brand.name,
      href: `/brands/${brand.slug}`
    }));

    return [
      { label: 'Home', href: '/' },
      {
        label: 'Categories',
        children: categoryItems
      },
      {
        label: 'Brands',
        children: brandItems
      },
      { label: 'Pre-Built PC', href: '/prebuilt-pcs' },
      { label: 'Custom Pc', href: '/custom-pcs' },
      { label: 'Blogs', href: '/blogs' },
      { label: 'Support', href: '/support' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ];
  }, [categories, brands]);

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

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="font-sans">
      {/* Desktop View (lg and above) */}
      <header className="hidden lg:block pt-4 pb-0 relative shadow-md z-40 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 items-center pb-4 gap-4">
            
            {/* 1. Logo Section */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-start">
              <Link to="/" className="flex items-center gap-3 group">
                {/* Logo */}
                <img 
                  src={logo} 
                  alt="iTech Computers Logo"
                  className="w-12 h-12 object-contain group-hover:scale-105 transition-transform"
                />

                {/* Text Block */}
                <div className="flex flex-col leading-tight">
                  <span className="text-2xl font-extrabold text-[#2c2358] tracking-tight uppercase">
                    iTech Computers
                  </span>
                  <span className="text-[10px] text-gray-700 tracking-widest uppercase font-medium">
                    Premium Electronics
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Search Bar (Center - Big) */}
            <div className="flex justify-center">
              <div className="w-full max-w-xl">
                <SearchBar />
              </div>
            </div>

            {/* 3. Right Actions (User, Wishlist, Cart) */}
            <div className="hidden lg:flex justify-end items-center gap-4 xl:gap-6 text-[#1a1a1a]">
              
              {/* Wishlist */}
              <Link to="/wishlist" className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors" title="Wishlist">
                <HeartIcon className="w-6 h-6 text-gray-700 group-hover:text-[#544D89] transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#544D89] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="flex items-center gap-2 group p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Cart">
                <div className="relative">
                  <CartIcon className="w-6 h-6 text-gray-700 group-hover:text-[#544D89] transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#544D89] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* User / Login */}
              <div className="flex items-center gap-2">
                <UserDropdown />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block border-t border-gray-100 mt-2">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-center h-12">
              <nav>
                <ul className="flex items-center space-x-1">
                  {updatedNavItems.map((item) => (
                    <NavLink key={item.label} item={item} />
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet View (below lg) */}
      <header className="lg:hidden bg-white shadow-md sticky top-0 z-40">
        {/* === TOP TIER NAVBAR === */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-16 flex justify-between items-center">
            {/* Left: Logo & Mobile Menu Button */}
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden text-black hover:text-[#544D89] p-2 -ml-2 rounded-md transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isMenuOpen}
              >
                <MenuIcon className="w-6 h-6" />
              </button>

              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                  <span className="text-lg font-bold text-[#2c2358] hover:text-[#433d6e] transition-colors truncate max-w-[140px] sm:max-w-none">
                    iTech Computers
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Right: Icons with real counts */}
            <div className="flex items-center space-x-1 sm:space-x-2">
               {/* Wishlist Icon Mobile */}
               <Link 
                  to="/wishlist" 
                  className="relative p-2 text-gray-700 hover:text-[#544D89]"
                  aria-label="Wishlist"
                >
                  <HeartIcon className="w-6 h-6"/>
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#544D89] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Link>

              {/* Cart Icon Mobile */}
              <Link 
                to="/cart" 
                className="relative p-2 text-gray-700 hover:text-[#544D89]"
                aria-label="Shopping Cart"
              >
                <CartIcon className="w-6 h-6"/>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#544D89] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        {/* === MOBILE SEARCH === */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="py-2">
              <SearchBar />
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
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#2c2358] text-white shrink-0">
              <div className="flex items-center gap-2">
                 <img src={logo} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />
                 <h2 className="text-lg font-bold">Menu</h2>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close navigation menu"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation Links - Scrollable area */}
            <nav className="flex-1 overflow-y-auto">
              <ul className="flex flex-col divide-y divide-gray-100">
                {updatedNavItems.map((item) => (
                  <MobileNavLink 
                    key={item.label} 
                    item={item} 
                    closeMenu={closeMobileMenu} 
                  />
                ))}
              </ul>
            </nav>

            {/* Compact User Section - Fixed at bottom */}
            <div className="shrink-0">
              {isAuthenticated ? (
                <AuthenticatedUserSection closeMobileMenu={closeMobileMenu} />
              ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="block w-full text-center bg-[#544D89] text-white py-2.5 px-4 rounded-lg hover:bg-[#433d6e] transition-colors font-semibold shadow-sm"
                      onClick={closeMobileMenu}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center bg-white border border-[#544D89] text-[#544D89] py-2.5 px-4 rounded-lg hover:bg-[#544D89]/5 transition-colors font-semibold"
                      onClick={closeMobileMenu}
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;