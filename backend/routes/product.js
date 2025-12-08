const express = require("express");
const {
    // 🎯 UNIFIED ENDPOINTS
    getProducts,                    // Unified search/filter/sort/pagination
    getProductBySlug,              // Single product view

    // 🎯 SPECIALIZED ENDPOINTS  
    getRelatedProducts,            // Related products
    getFeaturedProducts,           // Featured products
    getNewArrivals,                // New arrivals

    // 🎯 LEGACY REDIRECTS (internal use)
    getAllProducts,                // → getProducts
    advancedSearch,                // → getProducts  
    searchProducts,                // → getProducts
    filterProducts,                // → getProducts
    getProductsByCategory,         // → getProducts
    getProductsByBrand,            // → getProducts

    // 🎯 PRODUCT VARIANTS
    getProductVariants,

    // 🎯 ADMIN ENDPOINTS
    createProduct,
    getAdminProducts,
    getAdminProductById,
    deleteProduct,
    addVariant,
    updateVariant,
    deleteVariant,
    addMultipleProducts,
    getProductsForSelection,
    getProductsByIds,
    getProductAnalytics,
    getLinkedProducts,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");
const { productUpload, handleMulterError, handleDynamicFields } = require("../config/multerConfig");

const router = express.Router();

// =============================================
// 🎯 PUBLIC ROUTES - UNIFIED PRODUCT SYSTEM
// =============================================

// 🎯 UNIFIED PRODUCT ENDPOINT (Handles everything)
// GET /api/products?search=laptop&brand=apple&category=mobiles&price[gte]=1000&rating=4&sort=price-low&page=1
router.get("/products", getProducts);

// 🎯 SINGLE PRODUCT & RELATED
router.get("/products/slug/:slug", getProductBySlug);                    // Single product detail
router.get("/products/related/:slug", getRelatedProducts);               // Related products
router.get("/products/featured", getFeaturedProducts);                   // Featured products
router.get("/products/new-arrivals", getNewArrivals);                    // New arrivals
// In productRoutes.js
router.get("/products/linked/:slug", getLinkedProducts);

// 🎯 PRODUCT VARIANTS
router.get("/products/:id/variants", getProductVariants);                // Get product variants
router.get("/products/by-ids", getProductsByIds);                        // Get products by IDs

// =============================================
// 🔄 LEGACY ENDPOINTS (Keep for backward compatibility)
// =============================================

router.get('/products/search', advancedSearch);                          // → /products?search=
router.get('/products/quick-search', searchProducts);                    // → /products?search=
router.get("/products/filters", filterProducts);                         // → /products?filters
router.get("/products/category/:categoryName", getProductsByCategory);   // → /products?category=
router.get("/products/brand/:brandName", getProductsByBrand);            // → /products?brand=

// =============================================
// 🔐 ADMIN ROUTES
// =============================================

// Admin products management
router.get('/admin/products', isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.get("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), getAdminProductById);
// router.delete("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

// Product creation
router.post("/admin/product/new",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    handleDynamicFields(),
    handleMulterError,
    createProduct
);

// Bulk operations
router.post("/admin/products/bulk", isAuthenticatedUser, authorizeRoles("admin"), addMultipleProducts);

// Variant management
router.post("/admin/product/:id/variant", isAuthenticatedUser, authorizeRoles("admin"), addVariant);
router.put("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), updateVariant);
router.delete("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), deleteVariant);

// Admin utilities
router.get("/admin/products/selection", isAuthenticatedUser, authorizeRoles("admin"), getProductsForSelection);
router.get('/admin/analytics/products', isAuthenticatedUser, authorizeRoles('admin'), getProductAnalytics);



module.exports = router;