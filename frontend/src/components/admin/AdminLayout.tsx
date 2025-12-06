import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SidebarItem } from './types/admin';
import { Icons } from './Icon';
import {Computer} from 'lucide-react'

// Redux imports
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/actions/authActions';
import {
  selectIsAuthenticated,
  selectUser,
  selectUserInitials
} from '../../redux/selectors';
import {
  selectProfile,
  selectProfileInitials,
  selectUserName,
  selectUserAvatar
} from '../../redux/selectors';
import { baseURL } from '../config/config';

// Import your admin components
import Products from './products/Products';
import CategoryList from './categories/CategoryList';
import CategoryForm from './categories/CategoryForm';
import BrandList from './brands/BrandList';
import BrandForm from './brands/BrandForm';
import UserList from './user/UserList';
import ReviewList from './reviews/ReviewList';
import HeroSectionList from './hero/HeroSectionList';
import HeroSectionForm from './hero/HeroSectionForm';
import SlideManagement from './hero/SlideManagement';
import SlideForm from './hero/SlideForm';
import ShowcaseSectionManagement from './showcase/ShowcaseSectionManagement';
import ShowcaseSectionForm from './showcase/ShowcaseSectionForm';
import PreBuiltPCList from './prebuilt-pcs/PreBuiltPCList';
import PreBuiltPCForm from './prebuilt-pcs/PreBuiltPCForm';
import PreBuiltPCBenchmarks from './prebuilt-pcs/PreBuiltPCBenchmarks';
import CouponList from './coupons/CouponList';
import CouponForm from './coupons/CouponForm';
import OrderList from './order/OrderList';
import OrderAnalytics from './order/OrderAnalytics';
import OrderDetails from './order/OrderDetails';
import UserDetailPage from './user/UserDetailPage';
import Dashboard from './dashboard/Dashboard';
import BlogList from './blog/BlogList';
import BlogEditor from './blog/BlogEditor';
import BlogStatisticsComponent from './blog/BlogStatistics';

// Helper function to get avatar URL
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return null;
  
  // If avatar is already a full URL, use it directly
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Otherwise, construct the full URL
  const baseUrl = import.meta.env.VITE_API_URL || baseURL;
  return `${baseUrl}${avatarPath}`;
};

// User Dropdown Component for Admin Header
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const userInitials = useAppSelector(selectUserInitials);
  
  // Profile selectors
  const profile = useAppSelector(selectProfile);
  const profileInitials = useAppSelector(selectProfileInitials);
  const profileName = useAppSelector(selectUserName);
  const profileAvatar = useAppSelector(selectUserAvatar);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use profile data if available, otherwise fall back to auth data
  const displayUser = profile || user;
  const displayInitials = profileInitials || userInitials || 'A';
  const displayName = profileName || user?.firstName || 'Admin';
  const displayEmail = user?.email || 'Administrator';
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

  // If not authenticated, show login link (though this shouldn't happen in admin)
  if (!isAuthenticated) {
    return (
      <Link 
        to="/login" 
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
        aria-label="Sign in"
      >
        <Icons.User className="w-6 h-6"/>
        <span className="hidden sm:block text-sm font-medium">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{displayEmail}</p>
        </div>
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1 ring-2 ring-white"></div>
          {avatarUrl ? (
            <img
              className="w-10 h-10 rounded-full object-cover"
              src={avatarUrl}
              alt={displayName}
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // The parent div with initials will show instead
              }}
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {displayInitials}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-sm text-gray-500 truncate">{displayEmail}</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">
              {displayUser?.role || 'Administrator'}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Icons.User className="w-4 h-4 mr-3" />
              My Profile
            </Link>
            
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Icons.Home className="w-4 h-4 mr-3" />
              Home
            </Link>

            {/* Admin specific links */}
            {displayUser?.role === 'admin' && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                >
                  <Icons.Dashboard className="w-4 h-4 mr-3" />
                  Admin Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <Icons.LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sidebar items configuration
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Icons.Dashboard className="w-5 h-5" />,
      path: '/admin'
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: <Icons.Products className="w-5 h-5" />,
      path: '/admin/catalog',
      children: [
        {
          id: 'categories',
          label: 'Categories',
          icon: <Icons.Categories className="w-4 h-4" />,
          path: '/admin/categories'
        },
        {
          id: 'brands',
          label: 'Brands',
          icon: <Icons.Brands className="w-4 h-4" />,
          path: '/admin/brands'
        },
        {
          id: 'products',
          label: 'Products',
          icon: <Icons.Products className="w-4 h-4" />,
          path: '/admin/products'
        },
          {
    id: 'prebuilt-pcs',
    label: 'Pre-built PCs',
    icon: <Computer className="w-5 h-5" />, // You'll need to add this icon
    path: '/admin/prebuilt-pcs'
  },
      ]
    },
      {
    id: 'hero-sections',
    label: 'Hero Sections',
    icon: <Icons.Image className="w-5 h-5" />,
    path: '/admin/hero-sections'
  },
    {
      id: 'users',
      label: 'User Management',
      icon: <Icons.Users className="w-5 h-5" />,
      path: '/admin/users'
    },
     {
        id: 'showcase-sections',
        label: 'Showcase Sections',
        icon: <Icons.Layout className="w-4 h-4" />,
        path: '/admin/showcase-sections'
      },
    {
      id: 'sales',
      label: 'Sales',
      icon: <Icons.Orders className="w-5 h-5" />,
      path: '/admin/sales',
      children: [
        {
          id: 'orders',
          label: 'Orders',
          icon: <Icons.Orders className="w-4 h-4" />,
          path: '/admin/orders'
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <Icons.Customers className="w-4 h-4" />,
          path: '/admin/customers'
        },
        {
          id: 'coupons',
          label: 'Coupons',
          icon: <Icons.Coupons className="w-4 h-4" />,
          path: '/admin/coupons'
        }
      ]
    },
    {
      id: 'reviews',
      label: 'Ratings & Reviews',
      icon: <Icons.Reviews className="w-5 h-5" />,
      path: '/admin/reviews'
    },
    {
      id: 'blog',
      label: 'blogs',
      icon: <Icons.Shipping className="w-5 h-5" />,
      path: '/admin/blogs'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <Icons.Payments className="w-5 h-5" />,
      path: '/admin/payments'
    }
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const getActivePath = () => {
    return location.pathname;
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    // Find the matching sidebar item
    const findItem = (items: SidebarItem[]): SidebarItem | undefined => {
      for (const item of items) {
        if (item.path === currentPath) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findItem(sidebarItems)?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar
        items={sidebarItems}
        activePath={getActivePath()}
        onItemClick={handleItemClick}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`
        min-h-screen transition-all duration-300
        ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}
      `}>
        {/* Fixed Top Header */}
        <header className="fixed top-0 right-0 left-0 bg-white shadow-sm border-b border-gray-200 z-40 transition-all duration-300"
          style={{ 
            marginLeft: isSidebarCollapsed ? '5rem' : '16rem' 
          }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Icons.ChevronRight className={`
                  w-5 h-5 text-gray-600 transition-transform duration-300
                  ${isSidebarCollapsed ? 'rotate-180' : ''}
                `} />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2"></div>
                <Icons.Bell className="w-5 h-5" />
              </button>

              {/* User Profile Dropdown */}
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Render the appropriate component based on route */}
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/categories/new" element={<CategoryForm />} />
              <Route path="/categories/edit/:id" element={<CategoryForm />} />
              <Route path="/products" element={<Products />} />
              {/* Brand Routes */}
              <Route path="/brands" element={<BrandList />} />
              <Route path="/brands/new" element={<BrandForm />} />
              <Route path="/brands/edit/:slug" element={<BrandForm />} />
              {/* User Management Routes */}
              <Route path="/users" element={<UserList />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/reviews" element={<ReviewList />} />
                {/* Hero Section Routes */}
              <Route path="/hero-sections" element={<HeroSectionList />} />
              <Route path="/hero-sections/new" element={<HeroSectionForm />} />
              <Route path="/hero-sections/edit/:id" element={<HeroSectionForm />} />
              <Route path="/hero-sections/:id/slides" element={<SlideManagement />} />
              <Route path="/hero-sections/:id/slides/new" element={<SlideForm />} />
              <Route path="/hero-sections/:id/slides/edit/:slideId" element={<SlideForm />} />

               {/* Add showcase section routes */}
              <Route path="/showcase-sections" element={<ShowcaseSectionManagement />} />
              <Route path="/showcase-sections/new" element={<ShowcaseSectionForm />} />
              <Route path="/showcase-sections/edit/:id" element={<ShowcaseSectionForm />} />

              
<Route path="/prebuilt-pcs" element={<PreBuiltPCList />} />
<Route path="/prebuilt-pcs/new" element={<PreBuiltPCForm />} />
<Route path="/prebuilt-pcs/edit/:id" element={<PreBuiltPCForm />} />
<Route path="/prebuilt-pcs/benchmarks/:id" element={<PreBuiltPCBenchmarks />} />

{/* 🆕 Coupon Routes */}
  <Route path="/coupons" element={<CouponList />} />
  <Route path="/coupons/new" element={<CouponForm />} />
  <Route path="/coupons/edit/:id" element={<CouponForm />} />


  <Route path="/orders" element={<OrderList />} />
  <Route path="/orders/analytics" element={<OrderAnalytics />} />
  <Route path="/orders/:orderId" element={<OrderDetails />} />

  {/* Blog Routes - UPDATED WITH /admin PREFIX */}
  <Route path="/blogs" element={<BlogList />} />
  <Route path="/blogs/new" element={<BlogEditor />} />
  <Route path="/blogs/edit/:id" element={<BlogEditor isEdit />} />
  <Route path="/blogs/statistics" element={<BlogStatisticsComponent />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;