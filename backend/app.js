const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

const errorMiddleware = require('./middlewares/error');
const brandRoutes = require("./routes/brand");
const adminRoutes = require("./routes/admin");
const categoryRoutes = require("./routes/category");
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const reviewRoutes = require('./routes/review');
const wishlistRoutes = require("./routes/wishlist");
const cartRoutes = require('./routes/cart');
const heroSectionRoutes = require('./routes/heroSection');
const showcaseSectionRoutes = require('./routes/showcaseSection');
const preBuiltPCRoutes = require('./routes/preBuiltPC')
const customPc = require('./routes/customPC')
const couponRoutes = require('./routes/couponRoutes');
const checkoutRoutes = require('./routes/checkout');
const paymentRoutes = require('./routes/payment');
const orderRoutes = require('./routes/order');
const analyticsRoutes = require('./routes/analyticsRoutes');
const blogRoutes = require('./routes/blogRoutes');
const videoRoutes = require('./routes/videoRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const { cleanupTempFiles } = require('./middlewares/uploadVideo');

const app = express();


// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://itech-compters.onrender.com',
    'https://www.itech-compters.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            // In development, allow all origins for debugging
            if (process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static files - FIXED PATH
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cleanupTempFiles);
// Alternative: Serve entire public folder
// app.use(express.static(path.join(__dirname, 'public')));

// API Routes

app.use('/api/v1', blogRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/sections', sectionRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1', productRoutes);
app.use("/api/v1", categoryRoutes);
app.use("/api/v1", brandRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', wishlistRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', heroSectionRoutes);
app.use('/api/v1', showcaseSectionRoutes);
app.use('/api/v1', preBuiltPCRoutes)
app.use('/api/v1', customPc)
app.use('/api/v1', couponRoutes);
app.use('/api/v1', checkoutRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', invoiceRoutes);

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Test route for static file serving
app.get('/api/v1/test-static', (req, res) => {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'public/uploads/brands');

    try {
        const files = fs.readdirSync(uploadsPath);
        res.json({
            success: true,
            message: 'Static file serving test',
            uploadsPath,
            files: files.slice(0, 10) // Show first 10 files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reading uploads directory',
            error: error.message,
            uploadsPath
        });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from build folder
    app.use(express.static(path.join(__dirname, '../frontend/dist'), {
        index: false,
        maxAge: '1d'
    }));

    // Serve index.html for all other routes (SPA)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else {
    // In development, just serve a basic response for root
    app.get('/', (req, res) => {
        res.json({
            message: 'Backend server is running',
            endpoints: {
                health: '/api/v1/health',
                testStatic: '/api/v1/test-static',
                brands: '/api/v1/brands',
                products: '/api/v1/products',
                categories: '/api/v1/categories'
            }
        });
    });
}

// Error handling middleware (MUST BE LAST)
app.use(errorMiddleware);

module.exports = app;