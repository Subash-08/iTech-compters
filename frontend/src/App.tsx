import React, { useEffect, lazy, Suspense, useState, memo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
// Removed eager ToastContainer import
import 'react-toastify/dist/ReactToastify.css'; 
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/admin/common/LoadingSpinner";
// Removed eager AuthInitializer import
import { useAppSelector } from "./redux/hooks";
import { selectIsAuthenticated, selectAuthLoading, selectUser } from "./redux/selectors";
import { HelmetProvider } from "react-helmet-async";

// ✅ IMPORT CRITICAL PAGES NON-LAZY (HIGH PRIORITY)
import Home from "./components/home/Home";
import ProductList from "./components/product/ProductList";
import ProductDisplay from "./components/product/ProductDisplay";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Cart from "./components/cart/Cart";
import Profile from "./components/profile/Profile";
import About from "./components/about/About";

// ✅ LAZY LOAD LESS CRITICAL PAGES
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Wishlist = lazy(() => import("./components/wishlist/Wishlist"));
const PreBuiltPCList = lazy(() => import("./components/prebuild/PreBuiltPCList"));
const PreBuiltPCDetail = lazy(() => import("./components/prebuild/PreBuiltPCDetail"));
const PCBuilder = lazy(() => import("./components/PCBuilder/PCBuilder"));
const Checkout = lazy(() => import("./components/checkout/Checkout"));
const OrderConfirmation = lazy(() => import("./components/checkout/OrderConfirmation"));
const OrderList = lazy(() => import("./components/order/OrderList"));
const OrderDetails = lazy(() => import("./components/order/OrderDetails"));
const OrderTracking = lazy(() => import("./components/order/OrderTracking"));
const SupportPage = lazy(() => import("./components/support/SupportPage"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/auth/ResetPassword"));
const BlogList = lazy(() => import("./components/blog/BlogList"));
const SingleBlog = lazy(() => import("./components/blog/SingleBlog"));
const BlogCategory = lazy(() => import("./components/blog/BlogCategory"));
const BlogTag = lazy(() => import("./components/blog/BlogTag"));
const ContactPage = lazy(() => import("./components/pages/ContactPage"));
const PrivacyPolicy = lazy(() => import("./components/pages/PrivacyPolicy"));
const RefundReturnsPolicy = lazy(() => import("./components/pages/RefundReturnsPolicy"));
const ShippingDeliveryPolicy = lazy(() => import("./components/pages/ShippingDeliveryPolicy"));
const WarrantyPolicy = lazy(() => import("./components/pages/WarrantyPolicy"));
const TermsConditions = lazy(() => import("./components/pages/TermsConditions"));

// ✅ FIX 1: Lazy Import AuthInitializer as a Component
const AuthInitializerLazy = lazy(() => import("./components/AuthInitializer"));

// ✅ Lazy Load ToastContainer
const ToastContainerLazy = lazy(() =>
  import("react-toastify").then(m => ({ default: m.ToastContainer }))
);

// ✅ Memoize Navbar & Footer
const NavbarMemo = memo(Navbar);
const FooterMemo = memo(Footer);

// ✅ FIX 1 (Implementation): Defer AuthInitializer logic safely using React State
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback if available to defer until main thread is free
    const idleCallback = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1));
    
    idleCallback(() => {
      setShowAuth(true);
    });
  }, []);

  return (
    <>
      {/* Conditionally mount the component so hooks run correctly */}
      {showAuth && (
        <Suspense fallback={null}>
          <AuthInitializerLazy />
        </Suspense>
      )}
      {children}
    </>
  );
};

// ✅ Optimize ScrollToTop
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname]);
  return null;
};

// ✅ Update PublicLayout to use Memoized components
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NavbarMemo />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <FooterMemo />
    </>
  );
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
};

// Loading Component
const PageLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// ✅ Lighter Suspense Fallback
const LazyRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-gray-50/50" />}>
      {children}
    </Suspense>
  );
};

// ✅ FIX 2: ProtectedRoute Logic Fixed
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  adminOnly = false
}: { 
  children: React.ReactNode; 
  requireAuth?: boolean;
  adminOnly?: boolean;
}) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authLoading = useAppSelector(selectAuthLoading);
  const user = useAppSelector(selectUser);

  // ❌ OLD: if (authLoading) return <PageLoading />; 
  // This blocked public pages.
  
  // ✅ NEW: Only block if this specific route REQUIRES auth
  if (requireAuth && authLoading) {
    return <PageLoading />;
  }

  // If auth is required and user is NOT logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin check
  if (requireAuth && adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
   
  // Redirect logged-in users away from Login/Register pages
  // Note: We check !authLoading here to prevent premature redirects
  if (!requireAuth && isAuthenticated && !authLoading) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <RootLayout>
          {/* ✅ Load ToastContainer only after mount */}
          {mounted && (
            <Suspense fallback={null}>
              <ToastContainerLazy
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
            </Suspense>
          )}
          
          <Routes>
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAuth={true} adminOnly={true}>
                  <LazyRoute>
                    <AdminLayout />
                  </LazyRoute>
                </ProtectedRoute>
              } 
            />
            
            {/* Auth Routes - NON-LAZY */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <PublicLayout>
                    <AuthLayout>
                      <Login />
                    </AuthLayout>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <PublicLayout>
                    <AuthLayout>
                      <Register />
                    </AuthLayout>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <PublicLayout>
                    <AuthLayout>
                      <LazyRoute>
                        <ForgotPassword />
                      </LazyRoute>
                    </AuthLayout>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reset-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <PublicLayout>
                    <AuthLayout>
                      <LazyRoute>
                        <ResetPassword />
                      </LazyRoute>
                    </AuthLayout>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Protected User Routes */}
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
                    <LazyRoute>
                      <Checkout />
                    </LazyRoute>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/orders" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <LazyRoute>
                      <OrderList />
                    </LazyRoute>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/account/orders/:orderId" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <LazyRoute>
                      <OrderDetails />
                    </LazyRoute>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/orders/track/:orderNumber" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <LazyRoute>
                      <OrderTracking />
                    </LazyRoute>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/order-confirmation/:orderNumber" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <LazyRoute>
                      <OrderConfirmation />
                    </LazyRoute>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />          

            {/* Public Routes - CRITICAL ONES NON-LAZY */}
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
              path="/contact" 
              element={
                <PublicLayout>
                  <LazyRoute>
                    <ContactPage />
                  </LazyRoute>
                </PublicLayout>
              } 
            />

            <Route path="/privacy-policy" element={<PublicLayout><LazyRoute><PrivacyPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/refund-policy" element={<PublicLayout><LazyRoute><RefundReturnsPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/shipping-policy" element={<PublicLayout><LazyRoute><ShippingDeliveryPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/warranty-policy" element={<PublicLayout><LazyRoute><WarrantyPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/terms-conditions" element={<PublicLayout><LazyRoute><TermsConditions /></LazyRoute></PublicLayout>} />
            
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
                  <LazyRoute>
                    <SupportPage />
                  </LazyRoute>
                </PublicLayout>
              } 
            />
             <Route 
              path="/about" 
              element={
                <PublicLayout>
                  <LazyRoute>
                    <About />
                  </LazyRoute>
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

            {/* Pre-built PC Routes */}
            <Route 
              path="/prebuilt-pcs" 
              element={
                <PublicLayout>
                  <LazyRoute>
                    <PreBuiltPCList />
                  </LazyRoute>
                </PublicLayout>
              } 
            />

            <Route 
              path="/custom-pcs" 
              element={
                <PublicLayout>
                  <LazyRoute>
                    <PCBuilder />
                  </LazyRoute>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/prebuilt-pcs/:slug" 
              element={
                <PublicLayout>
                  <LazyRoute>
                    <PreBuiltPCDetail />
                  </LazyRoute>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/wishlist" 
              element={
                  <PublicLayout>
                    <LazyRoute>
                      <Wishlist />
                    </LazyRoute>
                  </PublicLayout>
              } 
            />

            <Route path="/blogs" element={<PublicLayout><LazyRoute><BlogList /></LazyRoute></PublicLayout>} />
            <Route path="/blog/tag/:tag" element={<PublicLayout><LazyRoute><BlogTag /></LazyRoute></PublicLayout>} />
            <Route path="/blog/category/:category" element={<PublicLayout><LazyRoute><BlogCategory /></LazyRoute></PublicLayout>} />
            <Route path="/blog/:slug" element={<PublicLayout><LazyRoute><SingleBlog /></LazyRoute></PublicLayout>} />
            
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