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

dotenv.config({ path: path.join(__dirname, 'config/config.env') });

const app = express();

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000', // Add this
    'http://127.0.0.1:5000'  // Add this
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/v1', productRoutes);
app.use("/api/v1", categoryRoutes);
app.use("/api/v1", brandRoutes);
app.use('/api/v1', adminRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from build folder
    app.use(express.static(path.join(__dirname, '../frontend/dist'), {
        index: false, // Don't serve index.html for all requests
        maxAge: '1d' // Cache static assets
    }));

    // Serve index.html for all other routes (SPA)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
} else {
    // In development, just serve a basic response for root
    app.get('/', (req, res) => {
        res.json({ message: 'Backend server is running' });
    });
}

// Error handling middleware (MUST BE LAST)
app.use(errorMiddleware);

module.exports = app;