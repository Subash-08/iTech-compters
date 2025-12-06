import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/home/Home";
import ProductList from "./components/product/ProductList";
import ProductDisplay from "./components/product/ProductDisplay";
import AdminLayout from "./components/admin/AdminLayout";
import LoadingSpinner from "./components/admin/common/LoadingSpinner";
// Import auth components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AuthInitializer from "./components/AuthInitializer";
import { useAppSelector } from "./redux/hooks";
import { selectIsAuthenticated, selectAuthLoading, selectUser } from "./redux/selectors";
import Profile from "./components/profile/Profile";
import Cart from "./components/cart/Cart";
import Wishlist from "./components/wishlist/Wishlist";

// ✅ ADD: Import Pre-built PC components
import PreBuiltPCList from "./components/prebuild/PreBuiltPCList";
import PreBuiltPCDetail from "./components/prebuild/PreBuiltPCDetail";
import FeaturedPreBuiltPCs from "./components/prebuilt/FeaturedPreBuiltPCs";
import PCBuilder from "./components/PCBuilder/PCBuilder";
import Checkout from "./components/checkout/Checkout";
import OrderConfirmation from "./components/checkout/OrderConfirmation";
import OrderList from "./components/order/OrderList";
import OrderDetails from "./components/order/OrderDetails";
import OrderTracking from "./components/order/OrderTracking";
import SupportPage from "./components/support/SupportPage";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import BlogList from "./components/blog/BlogList";
import SingleBlog from "./components/blog/SingleBlog";
import BlogCategory from "./components/blog/BlogCategory";
import BlogTag from "./components/blog/BlogTag";
import { HelmetProvider } from "react-helmet-async";

// ✅ UPDATED: Root Layout - AuthInitializer at the top level
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AuthInitializer /> {/* ✅ Initialize auth for entire app */}
      {children}
    </>
  );
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <Footer />
    </>
  );
};

// Auth Layout (No Header & Footer for auth pages)
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
};

// Loading component for suspense fallback
const PageLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  requireAuth?: boolean;
  adminOnly?: boolean;
}> = ({ 
  children, 
  requireAuth = true,
  adminOnly = false
}) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authLoading = useAppSelector(selectAuthLoading);
  const user = useAppSelector(selectUser);

  // Show loading while checking authentication
  if (authLoading) {
    return <PageLoading />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAuth && adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
   
  // If route doesn't require auth but user is authenticated, redirect from auth pages
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
     <HelmetProvider>
    <BrowserRouter>
      {/* ✅ WRAP ENTIRE APP WITH ROOT LAYOUT */}
      <RootLayout>
        {/* React Toastify Container for notifications */}
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        
        <Routes>
          {/* Admin Routes - Protected and No Header & Footer */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAuth={true} adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            } 
          />
          
          {/* Auth Routes - No Header & Footer */}
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthLayout>
                  <Login />
                </AuthLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/register" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthLayout>
                  <Register />
                </AuthLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/forgot-password" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthLayout>
                  <ForgotPassword />
                </AuthLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reset-password" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthLayout>
                  <ResetPassword />
                </AuthLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Protected User Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <PublicLayout>
                  <Profile />
                </PublicLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
  path="/checkout" 
  element={
    <ProtectedRoute>
      <PublicLayout>
        <Checkout />
      </PublicLayout>
    </ProtectedRoute>
  } 
/>
<Route 
  path="/account/orders" 
  element={
    <ProtectedRoute>
      <PublicLayout>
        <OrderList />
      </PublicLayout>
    </ProtectedRoute>
  } 
/>

<Route 
  path="/account/orders/:orderId" 
  element={
    <ProtectedRoute>
      <PublicLayout>
        <OrderDetails />
      </PublicLayout>
    </ProtectedRoute>
  } 
/>

<Route 
  path="/orders/track/:orderNumber" 
  element={
        <ProtectedRoute>
    <PublicLayout>
      <OrderTracking />
    </PublicLayout>
    </ProtectedRoute>
  } 
/>
<Route 
    path="/order-confirmation/:orderNumber" 
    element={
        // 1. MUST be protected, as it contains sensitive order data
        <ProtectedRoute>
                <OrderConfirmation />
        </ProtectedRoute>
    } 
/>         
          {/* Public Routes - With Header & Footer */}
          <Route 
            path="/" 
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            } 
          />

          <Route 
            path="/cart" 
            element={
              <PublicLayout>
                <Cart />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/products" 
            element={
              <PublicLayout>
                <ProductList />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/products/category/:categoryName" 
            element={
              <PublicLayout>
                <ProductList />
              </PublicLayout>
            } 
          />
          <Route 
            path="/support" 
            element={
              <PublicLayout>
                <SupportPage />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/products/brand/:brandName" 
            element={
              <PublicLayout>
                <ProductList />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/product/:slug" 
            element={
              <PublicLayout>
                <ProductDisplay />
              </PublicLayout>
            } 
          />

          {/* ✅ ADD: Pre-built PC Routes */}
          <Route 
            path="/prebuilt-pcs" 
            element={
              <PublicLayout>
                <PreBuiltPCList />
              </PublicLayout>
            } 
          />

                    <Route 
            path="/custom-pcs" 
            element={
              <PublicLayout>
                <PCBuilder />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/prebuilt-pcs/:slug" 
            element={
              <PublicLayout>
                <PreBuiltPCDetail />
              </PublicLayout>
            } 
          />
          
          <Route 
            path="/wishlist" 
            element={
              <PublicLayout>
                <Wishlist />
              </PublicLayout>
            } 
          />

                    <Route 
            path="/blog" 
            element={
              <PublicLayout>
                <BlogList />
              </PublicLayout>
            } 
          />
                              <Route 
            path="/blog/tag/:tag" 
            element={
              <PublicLayout>
                <BlogTag />
              </PublicLayout>
            } 
          />
                              <Route 
            path="/blog/category/:category" 
            element={
              <PublicLayout>
                <BlogCategory />
              </PublicLayout>
            } 
          />
                              <Route 
            path="/blog/:slug" 
            element={
              <PublicLayout>
                <SingleBlog />
              </PublicLayout>
            } 
          />
          
          {/* Search Route */}
          <Route 
            path="/search" 
            element={
              <PublicLayout>
                <ProductList />
              </PublicLayout>
            } 
          />

          

          {/* Redirects */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* 404 Page */}
          <Route 
            path="*" 
            element={
              <PublicLayout>
                <div className="min-h-screen flex items-center justify-center bg-white">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </PublicLayout>
            } 
          />
        </Routes>
      </RootLayout>
    </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;