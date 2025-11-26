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
// Memoized selectors
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
} from '../../src/redux/selectors/index';
import { baseURL } from './config/config';
import SearchBar from './home/SearchBar';
import api from '../components/config/axiosConfig';

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
  { label: 'PC Build', href: '/pc-build' },
];

// Updated AuthenticatedUserSection Component with Profile Button
const AuthenticatedUserSection: React.FC<{ closeMobileMenu: () => void }> = ({ closeMobileMenu }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const profileAvatar = useAppSelector(selectUserAvatar);
  
  const [imageError, setImageError] = useState(false);
  
  const displayUser = profile || user;
  const displayAvatar = profileAvatar || user?.avatar;
  const avatarUrl = getAvatarUrl(displayAvatar);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const userInitials = `${displayUser?.firstName?.charAt(0) || 'U'}${displayUser?.lastName?.charAt(0) || ''}`;

  return (
    <div className="p-3">
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
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-300">
              <span className="text-white text-sm font-medium">
                {userInitials}
              </span>
            </div>
          )}
          
          {/* User Name */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
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
            className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
              className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
            onClick={() => {
              dispatch(logout());
              closeMobileMenu();
            }}
            className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            aria-label="Sign out"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
  if (item.children && item.children.length > 0) {
    return (
      <li className="group relative">
        <Link
          to={item.href}
          className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
        >
          {item.label}
          <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
        </Link>
        <ul className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ring-1 ring-black ring-opacity-5">
          {item.children.map((child) => (
            <li key={child.label}>
              <Link
                to={child.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.href}
        className="text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50 block"
      >
        {item.label}
      </Link>
    </li>
  );
};

interface MobileNavLinkProps {
  item: NavItem;
  closeMenu: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ item, closeMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center py-3 text-gray-800 hover:text-blue-600 transition-colors px-4"
          aria-expanded={isOpen}
          aria-controls={`submenu-${item.label}`}
        >
          <span className="font-semibold">{item.label}</span>
          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div 
          id={`submenu-${item.label}`} 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
        >
          <ul className="pl-6 pt-2 pb-2 border-l border-gray-200 ml-4">
            {item.children.map((child) => (
              <li key={child.label}>
                <Link 
                  to={child.href} 
                  className="block py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={closeMenu}
                >
                  {child.label}
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
        className="block py-3 text-gray-800 hover:text-blue-600 transition-colors font-semibold px-4"
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
  { label: 'My Orders', href: 'account/orders', icon: 'orders' },
  { label: 'Wishlist', href: '/wishlist', icon: 'heart' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
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

// User Dropdown Component
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
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
    setImageError(false); // Reset error state when reopening
  };

  // If not authenticated, show login link
  if (!isAuthenticated) {
    return (
      <Link 
        to="/login" 
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
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
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none px-3 py-2 rounded-md hover:bg-gray-50"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          {/* User Avatar */}
          {avatarUrl && !imageError ? (
            <img
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
              src={avatarUrl}
              alt={`${displayUser?.firstName || 'User'} avatar`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-200">
              <span className="text-white text-sm font-medium">
                {userInitials}
              </span>
            </div>
          )}
          
          {/* User Name (visible on larger screens) */}
          <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">
            {displayUser?.firstName || 'User'}
          </span>
          
          {/* Chevron Icon */}
          <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white shadow-xl rounded-lg border border-gray-200 z-50">
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
  const profile = useAppSelector(selectProfile);
  const profileAvatar = useAppSelector(selectUserAvatar);

  const [imageError, setImageError] = useState(false);

  const displayUser = profile || user;
  const displayAvatar = profileAvatar || user?.avatar;
  const avatarUrl = getAvatarUrl(displayAvatar);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const handleLogout = () => {
    dispatch(logout());
    document.body.style.overflow = 'auto';
  };

  const closeMenu = () => {
    document.body.style.overflow = 'auto';
  };

  const userMenuItems = getUserMenuItems(displayUser?.role);
  const userInitials = `${displayUser?.firstName?.charAt(0) || 'U'}${displayUser?.lastName?.charAt(0) || ''}`;

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
            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
            onClick={closeMenu}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
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
          {avatarUrl && !imageError ? (
            <img
              className="h-10 w-10 rounded-full object-cover border border-gray-200"
              src={avatarUrl}
              alt={`${displayUser?.firstName || 'User'} avatar`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-200">
              <span className="text-white text-sm font-medium">
                {userInitials}
              </span>
            </div>
          )}
        </div>
        <div className="ml-3">
          <div className="text-base font-medium text-gray-800">
            {displayUser?.firstName} {displayUser?.lastName}
          </div>
          <div className="text-sm font-medium text-gray-500 truncate max-w-[200px]">
            {displayUser?.email}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {userMenuItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            onClick={closeMenu}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border-t border-gray-200 mt-2 pt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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
        href: '/categories',
        children: categoryItems
      },
      {
        label: 'Brands',
        href: '/brands', 
        children: brandItems
      },
      { label: 'Pre-Built PC', href: '/prebuilt-pcs' },
      { label: 'PC Build', href: '/pc-build' },





      {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Custom Builds', href: '/services/custom-builds' },
      { label: 'Repairs & Upgrades', href: '/services/repairs' },
      { label: 'Consulting', href: '/services/consulting' },
    ],
  },
  { label: 'Custom Pc', href: '/custom-pcs' },
  { label: 'Blog', href: '/blog' },
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
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        {/* === TOP TIER NAVBAR === */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-20 flex justify-between items-center">
            {/* Left: Logo & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button - MOVED TO LEFT SIDE */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-50 transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isMenuOpen}
              >
                <MenuIcon className="w-6 h-6" />
              </button>

              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  iTech Computers
                </Link>
              </div>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-grow justify-center px-8">
              <SearchBar />
            </div>
            
            {/* Right: Icons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 sm:space-x-5 text-gray-600">
                {/* Wishlist */}
                <Link 
                  to="/wishlist" 
                  className="hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-gray-50"
                  aria-label="Wishlist"
                >
                  <HeartIcon className="w-6 h-6"/>
                </Link>
                
                {/* Cart */}
                <Link 
                  to="/cart" 
                  className="relative hover:text-blue-600 transition-colors duration-200 p-2 rounded-md hover:bg-gray-50"
                  aria-label="Shopping Cart"
                >
                  <CartIcon className="w-6 h-6"/>
                  {/* Cart count badge can be added here */}
                </Link>
                
                {/* User dropdown - HIDDEN ON MOBILE, shown in mobile menu */}
                <div className="hidden lg:block">
                  <UserDropdown />
                </div>
              </div>

              {/* Mobile User Icon - Only show when not authenticated */}
              {!isAuthenticated && (
                <div className="lg:hidden">
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-50 transition-colors"
                    aria-label="Sign in"
                  >
                    <UserIcon className="w-6 h-6"/>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* === BOTTOM TIER NAVBAR (Desktop) & MOBILE SEARCH === */}
        <div className="border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex h-12 items-center justify-center">
              <ul className="flex items-center space-x-1 font-medium">
                {updatedNavItems.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </ul>
            </nav>

            {/* Mobile Search Bar */}
            <div className="lg:hidden py-3">
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
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-blue-600 text-white shrink-0">
              <h2 className="text-xl font-bold">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-white hover:text-blue-200 rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Close navigation menu"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation Links - Scrollable area */}
            <nav className="flex-1 overflow-y-auto">
              <ul className="flex flex-col divide-y divide-gray-200">
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
            <div className="shrink-0 border-t border-gray-200 bg-white">
              {isAuthenticated ? (
                <AuthenticatedUserSection closeMobileMenu={closeMobileMenu} />
              ) : (
                <div className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                      onClick={closeMobileMenu}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors font-medium"
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
    </>
  );
};

export default Navbar;