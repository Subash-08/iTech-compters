import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/home/Home";
import ProductList from "./components/home/ProductList";
import ProductDisplay from "./components/product/ProductDisplay";
import AdminLayout from "./components/admin/AdminLayout";

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes - No Header & Footer */}
        <Route path="/admin/*" element={<AdminLayout />} />
        
        {/* Public Routes - With Header & Footer */}
        <Route path="/" element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        } />
        <Route path="/products" element={
          <PublicLayout>
            <ProductList />
          </PublicLayout>
        } />
        <Route path="/products/category/:categoryName" element={
          <PublicLayout>
            <ProductList />
          </PublicLayout>
        } />
        <Route path="/products/brand/:brandName" element={
          <PublicLayout>
            <ProductList />
          </PublicLayout>
        } />
        <Route path="/product/:slug" element={
          <PublicLayout>
            <ProductDisplay />
          </PublicLayout>
        } />
        {/* Optional: 404 page */}
        <Route path="*" element={
          <PublicLayout>
            <div className="p-10 text-center">Page Not Found</div>
          </PublicLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;