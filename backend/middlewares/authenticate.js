const ErrorHandler = require("../utils/errorHandler");
const User = require('../models/userModel')
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    let token;

    // Check Authorization header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Fall back to cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new ErrorHandler('Login first to access this resource', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorHandler('User not found', 401));
        }

        // Optional: Check if user account is active
        if (req.user.status !== 'active') {
            return next(new ErrorHandler('Your account has been deactivated', 401));
        }

        next();
    } catch (error) {
        // Handle different JWT errors
        if (error.name === 'JsonWebTokenError') {
            return next(new ErrorHandler('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new ErrorHandler('Token has expired', 401));
        }
        return next(new ErrorHandler('Authentication failed', 401));
    }
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorHandler('Authentication required', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(
                `Role (${req.user.role}) is not allowed to access this resource`,
                403 // Use 403 Forbidden instead of 401
            ));
        }
        next();
    };
};