const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const crypto = require('crypto');
const n8nService = require('../services/n8nService');
const fs = require('fs');
const path = require('path');

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

// Google authentication - improved version
exports.googleAuth = catchAsyncError(async (req, res, next) => {
    const { accessToken, googleProfile } = req.body;

    if (!accessToken && !googleProfile) {
        return next(new ErrorHandler('Google authentication data required', 400));
    }

    let profile = googleProfile;

    // If only accessToken is provided, verify it
    if (accessToken && !googleProfile) {
        try {
            // You'll need to implement Google token verification
            profile = await verifyGoogleToken(accessToken);
        } catch (error) {
            return next(new ErrorHandler('Invalid Google token', 401));
        }
    }

    if (!profile || !profile.id || !profile.email) {
        return next(new ErrorHandler('Invalid Google profile data', 400));
    }

    const user = await User.findOrCreateGoogleUser(profile);
    sendToken(user, 200, res, 'Google login successful');
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

// Get single user details (Admin)
exports.getSingleUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        user
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


// @desc    Get complete user profile with cart, wishlist, orders
// @route   GET /api/v1/user/complete-profile
// @access  Private
// Add this to your authController.js
exports.getCompleteUserProfile = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
        .select('-password -emailVerificationToken -resetPasswordToken')
        .populate({
            path: 'cartId',
            populate: {
                path: 'items.product',
                model: 'Product',
                select: 'name price images slug stock discountPrice'
            }
        })
        .populate({
            path: 'wishlistId',
            populate: {
                path: 'items.product',
                model: 'Product',
                select: 'name price images slug stock discountPrice brand category'
            }
        })


    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

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
                wishlistId: user.wishlistId?._id
            },
            cart: user.cartId,
            wishlist: user.wishlistId,
            recentOrders: user.orders || []
        }
    });
});
