const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    googleAuth,
    logout,
    forgotPassword,
    resetPassword,
    updatePassword,
    getUserProfile,
    updateProfile,
    removeAvatar,
    verifyEmail,
    resendVerification,
    getAllUsers,
    getSingleUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getCompleteUserProfile,
    getUserAnalytics,
    verifyResetToken
} = require('../controllers/authController');


const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { userUpload, handleMulterError } = require('../config/multerConfig');

// Authentication routes
router.post('/register',
    userUpload.single('avatar'),
    handleMulterError,
    registerUser
);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/logout', logout);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password routes
router.post('/password/forgot', forgotPassword);
router.put('/password/reset', resetPassword);
router.get('/password/reset/verify', verifyResetToken);

// Profile routes (Authenticated)
router.get('/profile', isAuthenticatedUser, getUserProfile);
router.put('/profile', isAuthenticatedUser, userUpload.single('avatar'), handleMulterError, updateProfile);
router.delete('/profile/avatar', isAuthenticatedUser, removeAvatar);
router.put('/password/update', isAuthenticatedUser, updatePassword);
router.get('/user/complete-profile', isAuthenticatedUser, getCompleteUserProfile);

router.get('/admin/analytics/users', isAuthenticatedUser, authorizeRoles('admin'), getUserAnalytics);



// Admin user management routes
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);
router.get('/users/:id', isAuthenticatedUser, authorizeRoles('admin'), getSingleUser);
router.put('/users/:id/role', isAuthenticatedUser, authorizeRoles('admin'), updateUserRole);
router.put('/users/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateUserStatus);


module.exports = router;