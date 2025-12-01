const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const crypto = require('crypto');
const n8nService = require('../services/n8nService');
const fs = require('fs');
const Order = require('../models/orderModel');
const path = require('path');
// Add this function to your controller
const { OAuth2Client } = require('google-auth-library');
const Wishlist = require('../models/wishlistModel')

const verifyGoogleToken = async (accessToken) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: accessToken, // Note: Google uses idToken, not accessToken
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            givenName: payload.given_name,
            familyName: payload.family_name,
            photo: payload.picture,
            emailVerified: payload.email_verified
        };
    } catch (error) {
        throw new Error('Invalid Google token');
    }
};

// ==================== AUTHENTICATION CONTROLLERS ====================

exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
        return next(new ErrorHandler('All fields are required', 400));
    }

    // ✅ ADDED: Password validation in controller
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return next(new ErrorHandler(
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            400
        ));
    }

    try {
        // Check if user exists
        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            return next(new ErrorHandler('User already exists with this email', 400));
        }

        // Generate username from first and last name
        const baseUsername = User.generateUsername(firstName, lastName);
        const username = await User.findAvailableUsername(baseUsername);

        const userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password,
            username: username
        };

        // Add avatar path if file was uploaded
        if (req.file) {
            userData.avatar = `/uploads/users/${req.file.filename}`;
        }
        const user = await User.create(userData);

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email via n8n (fire and forget)
        n8nService.sendEmailVerification(user, verificationToken)
            .then(result => {
                if (result.success) {
                } else if (result.skipped) {
                } else {
                }
            })
            .catch(error => {
                console.error(`❌ Background email error for ${user.email}:`, error.message);
            });

        sendToken(user, 201, res, 'Registration successful. Please check your email for verification.');

    } catch (error) {
        console.error('❌ Registration error details:', error);

        // Handle specific validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return next(new ErrorHandler(messages.join(', '), 400));
        }

        if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.email) {
                return next(new ErrorHandler('User already exists with this email', 400));
            }
            if (error.keyPattern && error.keyPattern.username) {
                return next(new ErrorHandler('Username already exists. Please try again.', 400));
            }
        }

        return next(new ErrorHandler('Registration failed. Please try again.', 500));
    }
});
// Login user
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password is entered
    if (!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400));
    }

    // Finding user in database with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // Check if password is correct
    const isPasswordMatched = await user.isValidPassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401));
    }

    // Check if account is active
    if (user.status !== 'active') {
        return next(new ErrorHandler('Account is not active', 401));
    }

    sendToken(user, 200, res, 'Login successful');
});

// controllers/authController.js - IMPROVED VERSION
exports.googleAuth = catchAsyncError(async (req, res, next) => {
    const { credential } = req.body;

    if (!credential) {
        return next(new ErrorHandler('Google credential is required', 400));
    }

    try {
        const profile = await verifyGoogleToken(credential);

        if (!profile || !profile.id || !profile.email) {
            return next(new ErrorHandler('Invalid Google profile data', 400));
        }

        // ✅ FIX: Use findOrCreateGoogleUser which handles social login users properly
        const user = await User.findOrCreateGoogleUser(profile);

        sendToken(user, 200, res, 'Google login successful');

    } catch (error) {
        console.error('Google auth error:', error);

        if (error.name === 'ValidationError') {
            return next(new ErrorHandler('User validation failed: ' + error.message, 400));
        }

        return next(new ErrorHandler('Google authentication failed', 401));
    }
});

// Logout user
exports.logout = catchAsyncError(async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==================== EMAIL VERIFICATION CONTROLLERS ====================

// Verify email - improved with welcome email
exports.verifyEmail = catchAsyncError(async (req, res, next) => {
    const { token, userId } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        _id: userId,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorHandler('Invalid or expired verification token', 400));
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email after verification
    n8nService.sendWelcomeEmail(user)
        .then(result => {
            if (result.success) {
            }
        })
        .catch(error => {
            console.error(`❌ Welcome email failed for ${user.email}:`, error.message);
        });

    res.status(200).json({
        success: true,
        message: 'Email verified successfully'
    });
});

// Resend verification email
exports.resendVerification = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    if (user.emailVerified) {
        return next(new ErrorHandler('Email is already verified', 400));
    }

    if (user.isGoogleUser) {
        return next(new ErrorHandler('Google users do not require email verification', 400));
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    await n8nService.sendEmailVerification(user, verificationToken);

    res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
    });
});

// ==================== PASSWORD MANAGEMENT CONTROLLERS ====================

// Forgot password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    if (user.isGoogleUser) {
        return next(new ErrorHandler('Password reset not available for Google login users', 400));
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await n8nService.sendPasswordReset(user, resetToken);

    res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
    });
});

// Reset password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const { token, userId, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        _id: userId,
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Invalid or expired reset token', 400));
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save();

    sendToken(user, 200, res, 'Password reset successfully');
});

// Update password (authenticated)
exports.updatePassword = catchAsyncError(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (user.isGoogleUser) {
        return next(new ErrorHandler('Password update not available for Google login users', 400));
    }

    // Check current password
    const isCorrect = await user.isValidPassword(currentPassword);
    if (!isCorrect) {
        return next(new ErrorHandler('Current password is incorrect', 400));
    }

    user.password = newPassword;
    await user.save();

    sendToken(user, 200, res, 'Password updated successfully');
});

// ==================== PROFILE MANAGEMENT CONTROLLERS ====================

// Get user profile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});

// Update user profile - improved validation
exports.updateProfile = catchAsyncError(async (req, res, next) => {
    const { firstName, lastName } = req.body;

    if (!firstName && !lastName && !req.file) {
        return next(new ErrorHandler('No data provided for update', 400));
    }

    const newUserData = {};

    if (firstName) {
        if (firstName.trim().length < 2) {
            return next(new ErrorHandler('First name must be at least 2 characters', 400));
        }
        newUserData.firstName = firstName.trim();
    }

    if (lastName) {
        if (lastName.trim().length < 1) {
            return next(new ErrorHandler('Last name must be at least 1 character', 400));
        }
        newUserData.lastName = lastName.trim();
    }

    // Handle avatar upload if file exists
    if (req.file) {
        const user = await User.findById(req.user.id);

        // Delete old avatar if exists and it's a local file
        if (user.avatar && user.avatar.includes('/uploads/users/')) {
            const oldAvatarPath = path.join(__dirname, '../public', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        newUserData.avatar = `/uploads/users/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user
    });
});

// Remove avatar
exports.removeAvatar = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (user.avatar && user.avatar.includes('/uploads/users/')) {
        const avatarPath = path.join(__dirname, '../public', user.avatar);
        if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
        }
    }

    user.avatar = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Avatar removed successfully',
        user
    });
});


// Get all users (Admin)
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// Add to authController.js
exports.getUserAnalytics = catchAsyncError(async (req, res, next) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));

    // Total users count
    const totalUsers = await User.countDocuments();

    // Active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
        lastLogin: { $gte: thirtyDaysAgo }
    });

    // New users this month
    const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
    });

    // Verified users
    const verifiedUsers = await User.countDocuments({
        isEmailVerified: true
    });

    // Users created today
    const newUsersToday = await User.countDocuments({
        createdAt: { $gte: startOfToday }
    });

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            activeUsers,
            newUsers: newUsersThisMonth,
            newUsersToday,
            verifiedUsers,
            unverifiedUsers: totalUsers - verifiedUsers
        }
    });
});

exports.getSingleUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .select('+socialLogins +addresses')
        .populate({
            path: 'orders',
            select: 'orderNumber status totalAmount items createdAt paymentStatus pricing',
            options: { sort: { createdAt: -1 }, limit: 10 }
        });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // ✅ FIXED: Get ALL orders with pricing.total for accurate total spent
    const allOrders = await Order.find({ user: req.params.id })
        .select('status pricing')
        .lean();

    // ✅ FIXED: Calculate totalSpent from pricing.total for PAID orders only
    const orderStats = {
        total: allOrders.length,
        completed: allOrders.filter(order => order.status === 'delivered').length,
        pending: allOrders.filter(order => ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)).length,
        cancelled: allOrders.filter(order => ['cancelled', 'refunded'].includes(order.status)).length,
        totalSpent: allOrders
            .filter(order => order.pricing && order.pricing.total > 0) // Only orders with pricing
            .reduce((sum, order) => sum + (order.pricing.total || 0), 0)
    };

    res.status(200).json({
        success: true,
        user: {
            // Basic profile
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,

            // Social logins
            socialLogins: user.socialLogins,
            isGoogleUser: user.socialLogins?.some(login => login.provider === 'google'),

            // Addresses
            addresses: user.addresses,
            defaultAddressId: user.defaultAddressId,

            // E-commerce
            cartId: user.cartId,
            wishlistId: user.wishlistId,

            // Orders
            recentOrders: user.orders, // Recent 10 orders for display
            orderStats // ✅ Accurate stats from ALL orders
        }
    });
});

// Update user role (Admin)
exports.updateUserRole = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        role: req.body.role
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user
    });
});

// Update user status (Admin)
exports.updateUserStatus = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        status: req.body.status
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        user
    });
});

// Delete user (Admin)
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // Delete avatar if exists
    if (user.avatar && user.avatar.includes('/uploads/users/')) {
        const avatarPath = path.join(__dirname, '../public', user.avatar);
        if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
        }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'User deleted successfully'
    });
});

exports.getCompleteUserProfile = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .select('-password -emailVerificationToken -resetPasswordToken')
        .populate({
            path: 'cartId',
            populate: {
                path: 'items.product',
                model: 'Product',
                select: 'name basePrice mrp discountPercentage stockQuantity images slug brand categories tags condition averageRating totalReviews'
            }
        });

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    // ✅ GET WISHLIST WITH BOTH PRODUCTS AND PREBUILT-PCs
    let wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items.product',
            model: 'Product',
            select: 'name basePrice mrp discountPercentage stockQuantity images slug brand categories tags condition averageRating totalReviews description specifications'
        })
        .populate({
            path: 'items.preBuiltPC', // ✅ ADD PreBuiltPC population
            model: 'PreBuiltPC',
            select: 'name images totalPrice basePrice discountPercentage stockQuantity averageRating totalReviews condition slug category performanceRating warranty components'
        });

    // Create wishlist if it doesn't exist
    if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });

        // Update user with wishlistId for future use
        await User.findByIdAndUpdate(userId, { wishlistId: wishlist._id });

        // Re-populate the empty wishlist
        wishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'items.product',
                model: 'Product',
                select: 'name basePrice mrp discountPercentage stockQuantity images slug brand categories tags condition averageRating totalReviews description specifications'
            })
            .populate({
                path: 'items.preBuiltPC', // ✅ ADD PreBuiltPC population
                model: 'PreBuiltPC',
                select: 'name images totalPrice basePrice discountPercentage stockQuantity averageRating totalReviews condition slug category performanceRating warranty components'
            });
    }

    // ✅ PROCESS WISHLIST ITEMS TO CREATE UNIFIED FORMAT
    const processedWishlist = {
        ...wishlist.toObject(),
        items: wishlist.items.map(item => {
            // If it's a PreBuiltPC item, create a unified format
            if (item.preBuiltPC) {
                return {
                    ...item,
                    unifiedProduct: {
                        _id: item.preBuiltPC._id,
                        name: item.preBuiltPC.name,
                        slug: item.preBuiltPC.slug,
                        basePrice: item.preBuiltPC.basePrice || item.preBuiltPC.totalPrice,
                        mrp: item.preBuiltPC.totalPrice, // Use totalPrice as MRP for PreBuiltPC
                        discountPercentage: item.preBuiltPC.discountPercentage,
                        stockQuantity: item.preBuiltPC.stockQuantity,
                        images: item.preBuiltPC.images,
                        averageRating: item.preBuiltPC.averageRating || 0,
                        totalReviews: item.preBuiltPC.totalReviews || 0,
                        condition: item.preBuiltPC.condition || 'New',
                        productType: 'prebuilt-pc',
                        // Additional PreBuiltPC specific fields
                        category: item.preBuiltPC.category,
                        performanceRating: item.preBuiltPC.performanceRating,
                        warranty: item.preBuiltPC.warranty,
                        components: item.preBuiltPC.components
                    }
                };
            }
            // If it's a regular product
            if (item.product) {
                return {
                    ...item,
                    unifiedProduct: {
                        ...item.product.toObject(),
                        productType: 'product'
                    }
                };
            }
            return item;
        }).filter(item => item.product || item.preBuiltPC) // Filter out invalid items
    };

    res.status(200).json({
        success: true,
        data: {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                username: user.username,
                emailVerified: user.emailVerified,
                status: user.status,
                cartId: user.cartId?._id,
                wishlistId: wishlist._id
            },
            cart: user.cartId,
            wishlist: processedWishlist, // ✅ Use processed wishlist with unified format
            recentOrders: user.orders || []
        }
    });
});