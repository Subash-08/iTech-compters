const Coupon = require("../models/couponModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");

// Helper function to validate coupon data
const validateCouponData = (data, isUpdate = false) => {
    const errors = [];

    if (!isUpdate || data.code !== undefined) {
        if (!data.code || data.code.trim().length === 0) {
            errors.push('Coupon code is required');
        } else if (data.code.length > 20) {
            errors.push('Coupon code cannot exceed 20 characters');
        }
    }

    if (!isUpdate || data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Coupon name is required');
        } else if (data.name.length > 100) {
            errors.push('Coupon name cannot exceed 100 characters');
        }
    }

    if (!isUpdate || data.discountType !== undefined) {
        if (!data.discountType || !['percentage', 'fixed', 'free_shipping'].includes(data.discountType)) {
            errors.push('Valid discount type is required');
        }
    }

    if (data.discountValue !== undefined && data.discountType !== 'free_shipping') {
        if (data.discountValue < 0) {
            errors.push('Discount value cannot be negative');
        }
        if (data.discountType === 'percentage' && data.discountValue > 100) {
            errors.push('Percentage discount cannot exceed 100%');
        }
    }

    if (data.maximumDiscount !== undefined && data.maximumDiscount < 0) {
        errors.push('Maximum discount cannot be negative');
    }

    if (data.minimumCartValue !== undefined && data.minimumCartValue < 0) {
        errors.push('Minimum cart value cannot be negative');
    }

    if (data.usageLimit !== undefined && data.usageLimit < 0) {
        errors.push('Usage limit cannot be negative');
    }

    if (data.usageLimitPerUser !== undefined && data.usageLimitPerUser < 0) {
        errors.push('Usage limit per user cannot be negative');
    }

    if (data.validFrom && data.validUntil) {
        const validFrom = new Date(data.validFrom);
        const validUntil = new Date(data.validUntil);

        if (validFrom >= validUntil) {
            errors.push('Valid until date must be after valid from date');
        }
    }

    return errors;
};

// @desc    Create a new coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            code,
            name,
            description,
            discountType,
            discountValue,
            maximumDiscount,
            minimumCartValue,
            usageLimit,
            usageLimitPerUser,
            validFrom,
            validUntil,
            applicableTo,
            specificProducts,
            specificCategories,
            specificBrands,
            excludedProducts,
            userEligibility,
            allowedUsers,
            minimumOrders,
            isOneTimeUse,
            status = 'active'
        } = req.body;

        // Validate required fields
        if (!code || !name || !discountType) {
            return next(new ErrorHandler('Code, name, and discount type are required', 400));
        }

        // Validate coupon data
        const validationErrors = validateCouponData(req.body);
        if (validationErrors.length > 0) {
            return next(new ErrorHandler(validationErrors[0], 400));
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({
            code: code.toUpperCase()
        });

        if (existingCoupon) {
            return next(new ErrorHandler('Coupon with this code already exists', 409));
        }

        // Parse array fields
        const parseArray = (data) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') return data.split(',').map(item => item.trim());
            return [];
        };

        // Create coupon
        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            name: name.trim(),
            description: description?.trim() || '',
            discountType,
            discountValue: discountType !== 'free_shipping' ? parseFloat(discountValue) : undefined,
            maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : null,
            minimumCartValue: parseFloat(minimumCartValue) || 0,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            usageLimitPerUser: parseInt(usageLimitPerUser) || 1,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            applicableTo: applicableTo || 'all_products',
            specificProducts: parseArray(specificProducts),
            specificCategories: parseArray(specificCategories),
            specificBrands: parseArray(specificBrands),
            excludedProducts: parseArray(excludedProducts),
            userEligibility: userEligibility || 'all_users',
            allowedUsers: parseArray(allowedUsers),
            minimumOrders: parseInt(minimumOrders) || 0,
            isOneTimeUse: Boolean(isOneTimeUse),
            status,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            coupon
        });

    } catch (error) {
        console.error('Create coupon error:', error);
        next(error);
    }
});

// Add to couponController.js
const getCouponAnalytics = catchAsyncErrors(async (req, res, next) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total coupons
    const totalCoupons = await Coupon.countDocuments();

    // Active coupons
    const activeCoupons = await Coupon.countDocuments({
        status: 'active',
        $and: [
            { startDate: { $lte: today } },
            {
                $or: [
                    { endDate: { $gte: today } },
                    { endDate: null }
                ]
            }
        ]
    });

    // Expired coupons
    const expiredCoupons = await Coupon.countDocuments({
        endDate: { $lt: today }
    });

    // Most used coupon
    const mostUsedCoupon = await Coupon.findOne()
        .sort({ usageCount: -1 })
        .select('code usageCount discountValue discountType');

    // Total usage count
    const totalUsage = await Coupon.aggregate([
        {
            $group: {
                _id: null,
                totalUsage: { $sum: '$usageCount' }
            }
        }
    ]);

    // Coupons created this month
    const newCouponsThisMonth = await Coupon.countDocuments({
        createdAt: { $gte: startOfMonth }
    });

    res.status(200).json({
        success: true,
        data: {
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            totalUsage: totalUsage[0]?.totalUsage || 0,
            mostUsedCoupon: mostUsedCoupon ? {
                code: mostUsedCoupon.code,
                usageCount: mostUsedCoupon.usageCount,
                discount: mostUsedCoupon.discountValue,
                type: mostUsedCoupon.discountType
            } : null,
            newCouponsThisMonth
        }
    });
});

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getAllCoupons = catchAsyncErrors(async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            discountType,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (status) query.status = status;
        if (discountType) query.discountType = discountType;

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort configuration
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Coupon.countDocuments(query);

        const coupons = await Coupon.find(query)
            .populate('specificProducts', 'name slug')
            .populate('specificCategories', 'name slug')
            .populate('specificBrands', 'name slug')
            .populate('createdBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: coupons.length,
            total,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            },
            coupons
        });

    } catch (error) {
        console.error('Get all coupons error:', error);
        next(error);
    }
});

// @desc    Get single coupon
// @route   GET /api/admin/coupons/:id
// @access  Private/Admin
const getCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('specificProducts', 'name slug price')
            .populate('specificCategories', 'name slug')
            .populate('specificBrands', 'name slug')
            .populate('excludedProducts', 'name slug')
            .populate('allowedUsers', 'name email')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!coupon) {
            return next(new ErrorHandler('Coupon not found', 404));
        }

        res.status(200).json({
            success: true,
            coupon
        });

    } catch (error) {
        console.error('Get coupon error:', error);
        next(error);
    }
});

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return next(new ErrorHandler('Coupon not found', 404));
        }

        // Validate coupon data
        const validationErrors = validateCouponData(req.body, true);
        if (validationErrors.length > 0) {
            return next(new ErrorHandler(validationErrors[0], 400));
        }

        // Check if code is being changed and if it already exists
        if (req.body.code && req.body.code !== coupon.code) {
            const existingCoupon = await Coupon.findOne({
                code: req.body.code.toUpperCase(),
                _id: { $ne: req.params.id }
            });

            if (existingCoupon) {
                return next(new ErrorHandler('Coupon with this code already exists', 409));
            }
        }

        // Parse array fields if provided
        const parseArray = (data) => {
            if (data === undefined) return undefined;
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') return data.split(',').map(item => item.trim());
            return [];
        };

        // Update fields
        const updateData = { ...req.body, updatedBy: req.user._id };

        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase().trim();
        }

        // Handle array fields
        if (req.body.specificProducts !== undefined) {
            updateData.specificProducts = parseArray(req.body.specificProducts);
        }
        if (req.body.specificCategories !== undefined) {
            updateData.specificCategories = parseArray(req.body.specificCategories);
        }
        if (req.body.specificBrands !== undefined) {
            updateData.specificBrands = parseArray(req.body.specificBrands);
        }
        if (req.body.excludedProducts !== undefined) {
            updateData.excludedProducts = parseArray(req.body.excludedProducts);
        }
        if (req.body.allowedUsers !== undefined) {
            updateData.allowedUsers = parseArray(req.body.allowedUsers);
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate('specificProducts', 'name slug')
            .populate('specificCategories', 'name slug')
            .populate('specificBrands', 'name slug')
            .populate('updatedBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            coupon: updatedCoupon
        });

    } catch (error) {
        console.error('Update coupon error:', error);
        next(error);
    }
});

// @desc    Update coupon status
// @route   PATCH /api/admin/coupons/:id/status
// @access  Private/Admin
const updateCouponStatus = catchAsyncErrors(async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return next(new ErrorHandler('Valid status is required', 400));
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            {
                status,
                updatedBy: req.user._id
            },
            { new: true }
        );

        if (!coupon) {
            return next(new ErrorHandler('Coupon not found', 404));
        }

        res.status(200).json({
            success: true,
            message: `Coupon ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            coupon
        });

    } catch (error) {
        console.error('Update coupon status error:', error);
        next(error);
    }
});

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return next(new ErrorHandler('Coupon not found', 404));
        }

        // Check if coupon has been used
        if (coupon.usageCount > 0) {
            return next(new ErrorHandler('Cannot delete coupon that has been used', 400));
        }

        await Coupon.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Delete coupon error:', error);
        next(error);
    }
});

// @desc    Validate coupon for user
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = catchAsyncErrors(async (req, res, next) => {
    try {
        const { code, cartItems = [], cartTotal = 0 } = req.body;
        const userId = req.user._id;

        if (!code) {
            return next(new ErrorHandler('Coupon code is required', 400));
        }

        const coupon = await Coupon.validateCoupon(code, userId, cartItems, cartTotal);

        // Calculate discount amount
        let applicableItemsTotal = cartTotal;

        if (coupon.applicableTo !== 'all_products') {
            applicableItemsTotal = cartItems.reduce((total, item) => {
                let isApplicable = false;

                if (coupon.applicableTo === 'specific_products') {
                    isApplicable = coupon.specificProducts.includes(item.product);
                } else if (coupon.applicableTo === 'specific_categories') {
                    isApplicable = coupon.specificCategories.includes(item.category);
                } else if (coupon.applicableTo === 'specific_brands') {
                    isApplicable = coupon.specificBrands.includes(item.brand);
                }

                return isApplicable ? total + (item.price * item.quantity) : total;
            }, 0);
        }

        const discountAmount = coupon.calculateDiscount(cartTotal, applicableItemsTotal);
        const finalAmount = cartTotal - discountAmount;

        res.status(200).json({
            success: true,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                name: coupon.name,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maximumDiscount: coupon.maximumDiscount,
                discountAmount,
                finalAmount,
                applicableTo: coupon.applicableTo,
                isFreeShipping: coupon.discountType === 'free_shipping'
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Get active coupons for user
// @route   GET /api/coupons/active
// @access  Private
const getActiveCoupons = catchAsyncErrors(async (req, res, next) => {
    try {
        const userId = req.user._id;

        const coupons = await Coupon.find({
            status: 'active',
            validFrom: { $lte: new Date() },
            validUntil: { $gte: new Date() },
            $or: [
                { userEligibility: 'all_users' },
                { userEligibility: 'existing_users' },
                { allowedUsers: userId }
            ]
        }).select('code name description discountType discountValue maximumDiscount minimumCartValue validUntil');

        res.status(200).json({
            success: true,
            count: coupons.length,
            coupons
        });

    } catch (error) {
        console.error('Get active coupons error:', error);
        next(error);
    }
});

module.exports = {
    createCoupon,
    getAllCoupons,
    getCoupon,
    updateCoupon,
    updateCouponStatus,
    deleteCoupon,
    validateCoupon,
    getActiveCoupons,
    getCouponAnalytics
};