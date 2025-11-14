// middlewares/cartAuth.js
const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel');
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

// ✅ OPTIONAL AUTH: For cart routes that work for both guests and authenticated users
exports.optionalAuth = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            req.user = null;
            return next();
        }

        // Check if user account is active
        if (req.user.status !== 'active') {
            return next(new ErrorHandler('Your account has been deactivated', 401));
        }

        next();
    } catch (error) {
        // For guest cart functionality, set user as null and continue
        req.user = null;
        next();
    }
});

// ✅ REQUIRED AUTH: For cart operations that need authentication (sync, clear, etc.)
exports.requireAuth = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler('Login first to access this resource', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorHandler('User not found', 401));
        }

        if (req.user.status !== 'active') {
            return next(new ErrorHandler('Your account has been deactivated', 401));
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new ErrorHandler('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new ErrorHandler('Token has expired', 401));
        }
        return next(new ErrorHandler('Authentication failed', 401));
    }
});