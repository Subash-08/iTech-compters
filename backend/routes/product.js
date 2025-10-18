const express = require("express");
const {
    getProducts, getProductById, getProductBySlug, getProductsByCategory,
    getProductsByBrand, searchProducts, filterProducts, getProductVariants,
    getProductReviews, addReview, updateReview, deleteReview, createProduct,
    getAdminProducts, getAdminProductById, updateProduct, deleteProduct,
    addVariant, updateVariant, deleteVariant, addMultipleProducts,
    getAllProducts,
    updateProductStatus
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
router.get("/products/:id/reviews", getProductReviews);  // Get all reviews for a product


// Logged In User


router.post("/product/:id/review", isAuthenticatedUser, addReview);  // Add a review
router.put("/product/:id/review/:reviewId", isAuthenticatedUser, updateReview);  // Update own review
router.delete("/product/:id/review/:reviewId", isAuthenticatedUser, deleteReview);  // Delete own review



// Admin Routes
// Admin products route
router.get('/admin/products', getAdminProducts);

// Update product status

router.post("/admin/product/new", createProduct);  // Create new product
router.get("/admin/product/:id", getAdminProductById);  // Get product by ID (admin)
router.delete("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);  // Delete product
router.post("/admin/products/bulk", addMultipleProducts);


// Admin routes for variants
router.post("/admin/product/:id/variant", isAuthenticatedUser, authorizeRoles("admin"), addVariant);  // Add variant
router.put("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), updateVariant);  // Update variant
router.delete("/admin/product/:id/variant/:variantId", isAuthenticatedUser, authorizeRoles("admin"), deleteVariant);  // Delete variant

module.exports = router; 
