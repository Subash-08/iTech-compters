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
import { selectIsAuthenticated, selectAuthLoading, selectUser, selectAuthInitialized } from "./redux/selectors";
import Profile from "./components/profile/Profile";
import Cart from "./components/cart/Cart";
import Wishlist from "./components/wishlist/Wishlist";

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
  const authInitialized = useAppSelector(selectAuthInitialized); // ✅ NEW
  const user = useAppSelector(selectUser);

  console.log('🛡️ ProtectedRoute:', {
    isAuthenticated,
    authLoading,
    authInitialized,
    hasUser: !!user,
    requireAuth,
    adminOnly
  });

  // ✅ CRITICAL FIX: Wait for auth to be initialized before making decisions
  if (!authInitialized || authLoading) {
    console.log('🛡️ ProtectedRoute: Waiting for auth initialization...');
    return <PageLoading />;
  }

  if (requireAuth && !isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }
  
  if (requireAuth && adminOnly && user?.role !== 'admin') {
    console.log('🛡️ ProtectedRoute: Redirecting to home - not admin');
    return <Navigate to="/" replace />;
  }
   
  if (!requireAuth && isAuthenticated) {
    console.log('🛡️ ProtectedRoute: Redirecting to home - already authenticated');
    return <Navigate to="/" replace />;
  }
  
  console.log('🛡️ ProtectedRoute: Allowing access');
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
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
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-md w-96">
                      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
                      <p className="text-gray-600 mb-4">This feature is coming soon.</p>
                    </div>
                  </div>
                </AuthLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reset-password" 
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthLayout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-md w-96">
                      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
                      <p className="text-gray-600 mb-4">This feature is coming soon.</p>
                    </div>
                  </div>
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
        <Route 
          path="/wishlist" 
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Wishlist />
              </PublicLayout>
            </ProtectedRoute>
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
  );
};

export default App;