import React, { useEffect, lazy, Suspense, useState, memo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css'; 
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/admin/common/LoadingSpinner";
import { useAppSelector } from "./redux/hooks";
import { selectIsAuthenticated, selectAuthLoading, selectUser } from "./redux/selectors";
import { HelmetProvider } from "react-helmet-async";

// ✅ EAGER LOAD (Only entry points)
// Keep Home eager so LCP (Hero Image/Text) renders immediately without a spinner.
import Home from "./components/home/Home";
// Keep Login eager if it's a high-traffic entry point, otherwise lazy it too.
import Login from "./components/auth/Login"; 
import ChatBot from "./components/home/ChatBot";
import CallButton from "./components/home/CallButton";
import CallActionButton from "./components/home/CallButton";
import UsedLaptopsPage from "./components/pages/UsedLaptopsPage";

// 🔥 FIX 1: AGGRESSIVE LAZY LOADING
// These were previously eager, causing the "Monolithic Bundle" issue.
const ProductList = lazy(() => import("./components/product/ProductList"));
const ProductDisplay = lazy(() => import("./components/product/ProductDisplay"));
const Register = lazy(() => import("./components/auth/Register"));
const Cart = lazy(() => import("./components/cart/Cart"));
const Profile = lazy(() => import("./components/profile/Profile"));
const About = lazy(() => import("./components/about/About"));

// Lazy Load Secondary Pages
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

const AuthInitializerLazy = lazy(() => import("./components/AuthInitializer"));

const ToastContainerLazy = lazy(() =>
  import("react-toastify").then(m => ({ default: m.ToastContainer }))
);

const NavbarMemo = memo(Navbar);
const FooterMemo = memo(Footer);

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showCallDock, setShowCallDock] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAuth(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 👇 HERO VISIBILITY OBSERVER
  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show dock ONLY when hero is NOT visible
        setShowCallDock(!entry.isIntersecting);
      },
      {
        threshold: 0.2, // hero must be mostly out of view
      }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {showAuth && (
        <Suspense fallback={null}>
          <AuthInitializerLazy />
        </Suspense>
      )}

      {children}

      <Suspense fallback={null}>
        {/* Show dock ONLY after hero AND when chat is closed */}
        {showCallDock && !chatOpen && (
          <CallActionButton onOpenChat={() => setChatOpen(true)} />
        )}

        <ChatBot
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      </Suspense>
    </>
  );
};


const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Defer scroll to next tick to avoid layout thrashing during render
    setTimeout(() => window.scrollTo(0, 0), 0);
  }, [pathname]);
  return null;
};

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NavbarMemo />
      {/* pt-16 reserves space for fixed navbar to prevent Layout Shift (CLS) */}
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

const PageLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Lighter Suspense Fallback
const LazyRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-gray-50/50" />}>
      {children}
    </Suspense>
  );
};

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

  if (requireAuth && authLoading) return <PageLoading />;
  if (requireAuth && !isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAuth && adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  if (!requireAuth && isAuthenticated && !authLoading) return <Navigate to="/" replace />;
  
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
          {mounted && (
            <Suspense fallback={null}>
<ToastContainerLazy
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        // 🛑 PREVENT FULL SCREEN STACKING:
        limit={3} 
      />
            </Suspense>
          )}
          
          <Routes>
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requireAuth={true} adminOnly={true}>
                  <LazyRoute><AdminLayout /></LazyRoute>
                </ProtectedRoute>
              } 
            />
            
            {/* Auth Routes */}
            <Route path="/login" element={<ProtectedRoute requireAuth={false}><PublicLayout><AuthLayout><Login /></AuthLayout></PublicLayout></ProtectedRoute>} />
            
            {/* 🔥 NOW LAZY LOADED */}
            <Route path="/register" element={<ProtectedRoute requireAuth={false}><PublicLayout><AuthLayout><LazyRoute><Register /></LazyRoute></AuthLayout></PublicLayout></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ProtectedRoute requireAuth={false}><PublicLayout><AuthLayout><LazyRoute><ForgotPassword /></LazyRoute></AuthLayout></PublicLayout></ProtectedRoute>} />
            <Route path="/reset-password" element={<ProtectedRoute requireAuth={false}><PublicLayout><AuthLayout><LazyRoute><ResetPassword /></LazyRoute></AuthLayout></PublicLayout></ProtectedRoute>} />
            
            {/* User Routes */}
            <Route path="/profile" element={<ProtectedRoute><PublicLayout><LazyRoute><Profile /></LazyRoute></PublicLayout></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><PublicLayout><LazyRoute><Checkout /></LazyRoute></PublicLayout></ProtectedRoute>} />
            <Route path="/account/orders" element={<ProtectedRoute><PublicLayout><LazyRoute><OrderList /></LazyRoute></PublicLayout></ProtectedRoute>} />
            <Route path="/account/orders/:orderId" element={<ProtectedRoute><PublicLayout><LazyRoute><OrderDetails /></LazyRoute></PublicLayout></ProtectedRoute>} />
            <Route path="/orders/track/:orderNumber" element={<ProtectedRoute><PublicLayout><LazyRoute><OrderTracking /></LazyRoute></PublicLayout></ProtectedRoute>} />
            <Route path="/order-confirmation/:orderNumber" element={<ProtectedRoute><PublicLayout><LazyRoute><OrderConfirmation /></LazyRoute></PublicLayout></ProtectedRoute>} />

            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            
            {/* 🔥 NOW LAZY LOADED */}
            <Route path="/cart" element={<PublicLayout><LazyRoute><Cart /></LazyRoute></PublicLayout>} />
            
            <Route path="/contact" element={<PublicLayout><LazyRoute><ContactPage /></LazyRoute></PublicLayout>} />
            <Route path="/privacy-policy" element={<PublicLayout><LazyRoute><PrivacyPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/refund-policy" element={<PublicLayout><LazyRoute><RefundReturnsPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/shipping-policy" element={<PublicLayout><LazyRoute><ShippingDeliveryPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/warranty-policy" element={<PublicLayout><LazyRoute><WarrantyPolicy /></LazyRoute></PublicLayout>} />
            <Route path="/terms-conditions" element={<PublicLayout><LazyRoute><TermsConditions /></LazyRoute></PublicLayout>} />
            
            {/* 🔥 NOW LAZY LOADED */}
            <Route path="/products" element={<PublicLayout><LazyRoute><ProductList /></LazyRoute></PublicLayout>} />
            <Route path="/used-laptops" element={<PublicLayout><LazyRoute><UsedLaptopsPage /></LazyRoute></PublicLayout>} />
            <Route path="/products/category/:categoryName" element={<PublicLayout><LazyRoute><ProductList /></LazyRoute></PublicLayout>} />
            <Route path="/products/brand/:brandName" element={<PublicLayout><LazyRoute><ProductList /></LazyRoute></PublicLayout>} />
            <Route path="/product/:slug" element={<PublicLayout><LazyRoute><ProductDisplay /></LazyRoute></PublicLayout>} />
            <Route path="/search" element={<PublicLayout><LazyRoute><ProductList /></LazyRoute></PublicLayout>} />

            <Route path="/support" element={<PublicLayout><LazyRoute><SupportPage /></LazyRoute></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><LazyRoute><About /></LazyRoute></PublicLayout>} />
            <Route path="/prebuilt-pcs" element={<PublicLayout><LazyRoute><PreBuiltPCList /></LazyRoute></PublicLayout>} />
            <Route path="/custom-pcs" element={<PublicLayout><LazyRoute><PCBuilder /></LazyRoute></PublicLayout>} />
            <Route path="/prebuilt-pcs/:slug" element={<PublicLayout><LazyRoute><PreBuiltPCDetail /></LazyRoute></PublicLayout>} />
            <Route path="/wishlist" element={<PublicLayout><LazyRoute><Wishlist /></LazyRoute></PublicLayout>} />
            <Route path="/blogs" element={<PublicLayout><LazyRoute><BlogList /></LazyRoute></PublicLayout>} />
            <Route path="/blog/tag/:tag" element={<PublicLayout><LazyRoute><BlogTag /></LazyRoute></PublicLayout>} />
            <Route path="/blog/category/:category" element={<PublicLayout><LazyRoute><BlogCategory /></LazyRoute></PublicLayout>} />
            <Route path="/blog/:slug" element={<PublicLayout><LazyRoute><SingleBlog /></LazyRoute></PublicLayout>} />
            
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            <Route path="*" element={
              <PublicLayout>
                <div className="min-h-screen flex items-center justify-center bg-white">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
                    <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">Go Back</button>
                  </div>
                </div>
              </PublicLayout>
            } />
          </Routes>
        </RootLayout>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;