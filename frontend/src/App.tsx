import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/admin/common/LoadingSpinner";
import AuthInitializer from "./components/AuthInitializer";
import { useAppSelector } from "./redux/hooks";
import { selectIsAuthenticated, selectAuthLoading, selectUser } from "./redux/selectors";
import { HelmetProvider } from "react-helmet-async";

// ✅ LAZY LOAD ALL PAGE COMPONENTS
const Home = lazy(() => import("./components/home/Home"));
const ProductList = lazy(() => import("./components/product/ProductList"));
const ProductDisplay = lazy(() => import("./components/product/ProductDisplay"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Login = lazy(() => import("./components/auth/Login"));
const Register = lazy(() => import("./components/auth/Register"));
const Profile = lazy(() => import("./components/profile/Profile"));
const Cart = lazy(() => import("./components/cart/Cart"));
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

// ✅ Root Layout - AuthInitializer at the top level
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AuthInitializer />
      {children}
    </>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// ✅ Memoize Layout Components to prevent re-renders
const PublicLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
      <Footer />
    </>
  );
});

PublicLayout.displayName = 'PublicLayout';

const AuthLayout = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-gray-50">
      {children}
    </main>
  );
});

AuthLayout.displayName = 'AuthLayout';

// ✅ Optimized Loading Component
const PageLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// ✅ Skeleton loading for better UX
const RouteSkeleton: React.FC<{ type?: 'full' | 'content' }> = ({ type = 'full' }) => {
  if (type === 'full') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          {/* Navbar skeleton */}
          <div className="h-16 bg-gray-200"></div>
          {/* Content skeleton */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 w-1/3 mb-6 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

// ✅ OPTIMIZED ProtectedRoute with React.memo and useMemo
const ProtectedRoute = React.memo(({ 
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

  // Show loading while checking authentication
  if (authLoading) {
    return <RouteSkeleton type="content" />;
  }

  // Memoize the auth check logic
  const shouldRedirect = React.useMemo(() => {
    if (requireAuth && !isAuthenticated) return 'login';
    if (requireAuth && adminOnly && user?.role !== 'admin') return 'home';
    if (!requireAuth && isAuthenticated) return 'home';
    return null;
  }, [requireAuth, isAuthenticated, adminOnly, user?.role]);

  if (shouldRedirect === 'login') {
    return <Navigate to="/login" replace />;
  }
  
  if (shouldRedirect === 'home') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// ✅ Create a wrapper for Suspense boundaries
const SuspenseWrapper: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <RouteSkeleton type="full" />
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <RootLayout>
          {/* React Toastify Container */}
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
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAuth={true} adminOnly={true}>
                  <SuspenseWrapper>
                    <AdminLayout />
                  </SuspenseWrapper>
                </ProtectedRoute>
              } 
            />
            
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthLayout>
                    <SuspenseWrapper fallback={<RouteSkeleton type="content" />}>
                      <Login />
                    </SuspenseWrapper>
                  </AuthLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthLayout>
                    <SuspenseWrapper fallback={<RouteSkeleton type="content" />}>
                      <Register />
                    </SuspenseWrapper>
                  </AuthLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthLayout>
                    <SuspenseWrapper fallback={<RouteSkeleton type="content" />}>
                      <ForgotPassword />
                    </SuspenseWrapper>
                  </AuthLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reset-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthLayout>
                    <SuspenseWrapper fallback={<RouteSkeleton type="content" />}>
                      <ResetPassword />
                    </SuspenseWrapper>
                  </AuthLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Protected User Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <Profile />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <Checkout />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/account/orders" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <OrderList />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/account/orders/:orderId" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <OrderDetails />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/orders/track/:orderNumber" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <OrderTracking />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/order-confirmation/:orderNumber" 
              element={
                <ProtectedRoute>
                  <PublicLayout>
                    <SuspenseWrapper>
                      <OrderConfirmation />
                    </SuspenseWrapper>
                  </PublicLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <Home />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/cart" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <Cart />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/contact" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ContactPage />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/privacy-policy" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <PrivacyPolicy />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/refund-policy" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <RefundReturnsPolicy />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/shipping-policy" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ShippingDeliveryPolicy />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/warranty-policy" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <WarrantyPolicy />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/terms-conditions" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <TermsConditions />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ProductList />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/products/category/:categoryName" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ProductList />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/support" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <SupportPage />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/products/brand/:brandName" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ProductList />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/product/:slug" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ProductDisplay />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            {/* Pre-built PC Routes */}
            <Route 
              path="/prebuilt-pcs" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <PreBuiltPCList />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />

            <Route 
              path="/custom-pcs" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <PCBuilder />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/prebuilt-pcs/:slug" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <PreBuiltPCDetail />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/wishlist" 
              element={
                  <PublicLayout>
                    <SuspenseWrapper>
                      <Wishlist />
                    </SuspenseWrapper>
                  </PublicLayout>
              } 
            />

            <Route 
              path="/blogs" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <BlogList />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/blog/tag/:tag" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <BlogTag />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/blog/category/:category" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <BlogCategory />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            <Route 
              path="/blog/:slug" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <SingleBlog />
                  </SuspenseWrapper>
                </PublicLayout>
              } 
            />
            
            {/* Search Route */}
            <Route 
              path="/search" 
              element={
                <PublicLayout>
                  <SuspenseWrapper>
                    <ProductList />
                  </SuspenseWrapper>
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

export default React.memo(App);