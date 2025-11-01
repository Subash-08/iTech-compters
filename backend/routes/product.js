const express = require("express");
const {
    getProducts, getProductById, getProductBySlug, getProductsByCategory,
    getProductsByBrand, searchProducts, filterProducts, getProductVariants,
    createProduct,
    getAdminProducts, getAdminProductById, updateProduct, deleteProduct,
    addVariant, updateVariant, deleteVariant, addMultipleProducts,
    getAllProducts,
    updateProductStatus,
    debugCategories,
    debugBrands,
    debugCategoryStructure,
    debugProductCategories,
} = require("../controllers/productController");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/authenticate");

const router = express.Router();

// Public / Not Logged In


router.get("/products", getProducts);  // Get all products with advanced filtering
router.get("/products/slug/:slug", getProductBySlug);  // Get product by slug
router.get("/products/category/:categoryName", getProductsByCategory);  // Products of a category by name/slug
router.get("/products/brand/:brandName", getProductsByBrand);  // Products of a brand by name/slug

// Optional: If you want a simpler endpoint for basic product listing
router.get("/products/all", getAllProducts);  // Simple product catalog (optional)


router.get("/products/search", searchProducts);  // Search products by name, tags, keywords
router.get("/products/filters", filterProducts);  // Filter products: price, rating, availability, condition
router.get("/products/:id/variants", getProductVariants);  // Get all variants of a product


// Admin Routes
// Admin products route
router.get('/admin/products', isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

// Update product status

router.post("/admin/product/new", isAuthenticatedUser, authorizeRoles("admin"), createProduct);  // Create new product
router.get("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), getAdminProductById);  // Get product by ID (admin)
router.delete("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);  // Delete product
router.post("/admin/products/bulk", isAuthenticatedUser, authorizeRoles("admin"), addMultipleProducts);


// Admin routes for variants
router.post("/admin/product/:id/variant", isAuthenticatedUser, authorizeRoles("admin"), addVariant);  // Add variant
router.put("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), updateVariant);  // Update variant
router.delete("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), deleteVariant);  // Delete variant

module.exports = router; 
