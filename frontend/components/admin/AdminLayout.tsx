import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SidebarItem } from './types/admin';
import { Icons } from './icon';

// Import your admin components
import Products from './products/Products';

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
        }
      ]
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
      id: 'shipping',
      label: 'Shipping',
      icon: <Icons.Shipping className="w-5 h-5" />,
      path: '/admin/shipping'
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

  const showAddButton = location.pathname === '/admin/products';

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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-3.77-4.31 1 1 0 00-1.47-.93 7.97 7.97 0 005.09 7.17 1 1 0 001.15-.93z" />
                </svg>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1 ring-2 ring-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Render the appropriate component based on route */}
            <Routes>
              <Route path="/products" element={<Products />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;