const catchAsyncErrors = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const PCQuote = require('../models/customPCQuote');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const PCRequirements = require('../models/PCRequirements');
const N8NService = require('../services/n8nService');

exports.getPCBuilderConfig = catchAsyncErrors(async (req, res, next) => {
    // Define the REQUIRED component slugs (hardcoded as per requirement)
    const REQUIRED_COMPONENT_SLUGS = [
        'cabinet', 'cpu', 'cooler', 'motherboard', 'memory',
        'graphics-card', 'psu', 'ssd'
    ];

    // Define parent category slugs
    const COMPONENTS_PARENT_SLUG = 'computer-components';
    const PERIPHERALS_PARENT_SLUG = 'peripherals';

    const [componentsParent, peripheralsParent] = await Promise.all([
        Category.findOne({ slug: COMPONENTS_PARENT_SLUG, status: 'active' }),
        Category.findOne({ slug: PERIPHERALS_PARENT_SLUG, status: 'active' })
    ]);

    // Step 2: Get REQUIRED components (hardcoded list - regardless of parent)
    const requiredCategories = await Category.find({
        slug: { $in: REQUIRED_COMPONENT_SLUGS },
        status: 'active'
    }).select('name slug description image parentCategory').lean();

    // Step 3: Get ALL children of COMPONENTS parent (these will be EXTRAS)
    let extraCategories = [];
    if (componentsParent) {
        extraCategories = await Category.find({
            parentCategory: componentsParent._id,
            status: 'active'
        }).select('name slug description image').lean();


    } else {

    }

    // Step 4: Get ALL children of PERIPHERALS parent
    let peripheralCategories = [];
    if (peripheralsParent) {
        peripheralCategories = await Category.find({
            parentCategory: peripheralsParent._id,
            status: 'active'
        }).select('name slug description image').lean();

    }

    // Step 5: Organize the configuration
    // Required components are separate from extras
    const config = {
        required: requiredCategories.map((cat, index) => ({
            ...cat,
            required: true,
            sortOrder: index,
            isPeripheral: false
        })),
        optional: [
            // Peripherals come first
            ...peripheralCategories.map((cat, index) => ({
                ...cat,
                required: false,
                sortOrder: index,
                isPeripheral: true
            })),
            // Extras come after peripherals
            ...extraCategories.map((cat, index) => ({
                ...cat,
                required: false,
                sortOrder: index + peripheralCategories.length,
                isPeripheral: false
            }))
        ]
    };

    res.status(200).json({
        success: true,
        config,
        metadata: {
            message: 'PC Builder configuration loaded successfully',
            counts: {
                required: config.required.length,
                peripherals: config.optional.filter(c => c.isPeripheral).length,
                extras: config.optional.filter(c => !c.isPeripheral).length
            },
            parentCategories: {
                components: COMPONENTS_PARENT_SLUG,
                peripherals: PERIPHERALS_PARENT_SLUG
            }
        }
    });
});

// Get products by category with advanced filtering

exports.getComponentsByCategory = catchAsyncErrors(async (req, res, next) => {
    const { category } = req.params;
    const {
        search,
        page = 1,
        limit = 20,
        sort = 'name',
        minPrice,
        maxPrice,
        brands,
        inStock,
        condition,
        minRating
    } = req.query;

    // Validate category exists
    const categoryDoc = await Category.findOne({ slug: category });
    if (!categoryDoc) {
        return next(new ErrorHandler('Category not found', 404));
    }

    // Build filter with validation
    const filter = {
        isActive: true,
        status: 'Published',
        categories: categoryDoc._id
    };

    // Search with text index support
    if (search && search.trim() !== '') {
        const searchTerm = search.trim();
        if (searchTerm.length < 2) {
            return next(new ErrorHandler('Search term must be at least 2 characters', 400));
        }
        filter.$text = { $search: searchTerm };
    }

    // Price range validation
    if (minPrice || maxPrice) {
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Number.MAX_SAFE_INTEGER;

        if (isNaN(min) || isNaN(max)) {
            return next(new ErrorHandler('Invalid price range parameters', 400));
        }
        if (min < 0 || max < 0) {
            return next(new ErrorHandler('Price cannot be negative', 400));
        }
        if (min > max) {
            return next(new ErrorHandler('Minimum price cannot be greater than maximum price', 400));
        }

        filter.basePrice = { $gte: min, $lte: max };
    }

    // Brand filter
    if (brands) {
        const brandList = Array.isArray(brands) ? brands : [brands];
        if (brandList.length > 0) {
            filter.brand = { $in: brandList };
        }
    }

    // Stock availability
    if (inStock === 'true') {
        filter.$or = [
            { stockQuantity: { $gt: 0 } },
            {
                hasVariants: true,
                'variants': {
                    $elemMatch: {
                        isActive: true,
                        stockQuantity: { $gt: 0 }
                    }
                }
            }
        ];
    }

    // Condition filter
    if (condition) {
        const validConditions = ['New', 'Used', 'Refurbished'];
        if (!validConditions.includes(condition)) {
            return next(new ErrorHandler('Invalid condition parameter', 400));
        }
        filter.condition = condition;
    }

    // Rating filter
    if (minRating) {
        const rating = Number(minRating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            return next(new ErrorHandler('Rating must be between 0 and 5', 400));
        }
        filter.averageRating = { $gte: rating };
    }

    // Pagination validation
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    if (isNaN(pageNum) || isNaN(limitNum)) {
        return next(new ErrorHandler('Invalid pagination parameters', 400));
    }

    // Sort configuration
    const sortConfig = {};
    const validSortFields = {
        'name': { name: 1 },
        'price-low': { basePrice: 1 },
        'price-high': { basePrice: -1 },
        'popular': { totalReviews: -1, averageRating: -1 },
        'newest': { createdAt: -1 },
        'rating': { averageRating: -1, totalReviews: -1 }
    };

    Object.assign(sortConfig, validSortFields[sort] || validSortFields.name);

    // Execute query with error handling
    let products, totalProducts;

    try {
        [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .select('name slug images basePrice mrp discountPercentage stockQuantity hasVariants variants averageRating totalReviews condition brand specifications')
                .populate('brand', 'name slug')
                .sort(sortConfig)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(filter)
        ]);
    } catch (dbError) {
        console.error('Database error in getComponentsByCategory:', dbError);
        return next(new ErrorHandler('Error fetching products', 500));
    }

    // Transform products for frontend
    const transformedProducts = products.map(product => ({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice,
        originalPrice: product.mrp || product.basePrice,
        discountPercentage: product.discountPercentage,
        image: product.images?.thumbnail?.url || '',
        inStock: product.stockQuantity > 0 || (product.hasVariants && product.variants.some(v => v.stockQuantity > 0)),
        brand: product.brand?.name || '',
        rating: product.averageRating,
        reviewCount: product.totalReviews,
        condition: product.condition,
        specifications: product.specifications?.[0]?.specs || []
    }));

    res.status(200).json({
        success: true,
        category: {
            name: categoryDoc.name,
            slug: categoryDoc.slug,
            description: categoryDoc.description
        },
        products: transformedProducts,
        pagination: {
            total: totalProducts,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalProducts / limitNum)
        },
        filters: {
            search: search || '',
            sort,
            minPrice: minPrice ? Number(minPrice) : null,
            maxPrice: maxPrice ? Number(maxPrice) : null,
            inStock: inStock === 'true',
            condition: condition || null,
            minRating: minRating ? Number(minRating) : null
        }
    });
});

exports.createPCQuote = catchAsyncErrors(async (req, res, next) => {
    const { customer, components, metadata = {} } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.email) {
        return next(new ErrorHandler('Name and email are required', 400));
    }

    if (!components || !Array.isArray(components)) {
        return next(new ErrorHandler('Components array is required', 400));
    }

    // Validate customer data
    const customerErrors = [];
    if (customer.name.length < 2) customerErrors.push('Name must be at least 2 characters');
    if (customer.name.length > 100) customerErrors.push('Name cannot exceed 100 characters');

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(customer.email)) customerErrors.push('Please provide a valid email address');

    // Relax phone validation to accept more formats
    if (customer.phone && customer.phone.trim() !== '') {
        const cleanedPhone = customer.phone.replace(/[^\d+]/g, '');
        if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
            customerErrors.push('Phone number should be between 10-15 digits');
        }
    }

    if (customer.notes && customer.notes.length > 1000) {
        customerErrors.push('Notes cannot exceed 1000 characters');
    }

    if (customerErrors.length > 0) {
        return next(new ErrorHandler(customerErrors.join(', '), 400));
    }

    // Validate and enrich components
    const enrichedComponents = [];
    const seenProducts = new Set();
    let totalPrice = 0;

    for (const [index, component] of components.entries()) {
        // Basic component validation
        if (!component.category || !component.categorySlug) {
            return next(new ErrorHandler(`Component at index ${index} must have category and categorySlug`, 400));
        }

        const enrichedComponent = {
            category: component.category.trim(),
            categorySlug: component.categorySlug.trim(),
            productId: component.productId || null,
            userNote: component.userNote ? component.userNote.trim().substring(0, 500) : '',
            selected: !!component.selected,
            required: !!component.required,
            sortOrder: component.sortOrder || index
        };
        if (component.selected && component.productId) {


            // Check for duplicate products
            if (seenProducts.has(component.productId)) {
                return next(new ErrorHandler(`Duplicate product selected: ${component.productId}`, 400));
            }
            seenProducts.add(component.productId);

            try {
                const product = await Product.findById(component.productId)
                    .select('name basePrice mrp images slug stockStatus isActive status')
                    .lean();

                if (!product) {
                    return next(new ErrorHandler(`Product with ID ${component.productId} not found`, 404));
                }

                // Simplified availability check
                const isAvailable = product.isActive !== false &&
                    (product.status === 'Published' || product.status === 'Active' || product.status === 'published');

                if (!isAvailable) {
                    return next(new ErrorHandler(`Product ${product.name} is not available`, 400));
                }
                enrichedComponent.productName = product.name;
                enrichedComponent.productPrice = product.basePrice || 0;
                enrichedComponent.productImage = product.images?.thumbnail?.url || '';
                enrichedComponent.productSlug = product.slug;

                // Add to total price
                totalPrice += enrichedComponent.productPrice;

            } catch (error) {
                console.error('Error fetching product:', error);
                return next(new ErrorHandler('Error validating product information', 500));
            }
        }

        enrichedComponents.push(enrichedComponent);
    }
    const selectedComponents = enrichedComponents.filter(comp => comp.selected);
    if (selectedComponents.length === 0) {
        return next(new ErrorHandler('At least one component must be selected', 400));
    }

    // Create the quote WITHOUT expiry
    const pcQuote = await PCQuote.create({
        customer: {
            name: customer.name.trim(),
            email: customer.email.toLowerCase().trim(),
            phone: customer.phone ? customer.phone.trim() : '',
            notes: customer.notes ? customer.notes.trim() : ''
        },
        components: enrichedComponents,
        totalEstimated: totalPrice,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: metadata.source || 'web'
    });

    // Trigger N8N workflow asynchronously
    N8NService.run("pcQuoteGenerated", {
        event: "pcQuoteGenerated",
        quoteId: pcQuote._id.toString(),
        customerName: pcQuote.customer.name,
        customerEmail: pcQuote.customer.email,
        customerPhone: pcQuote.customer.phone || '',
        status: pcQuote.status,
        componentCount: pcQuote.components.filter(c => c.selected).length,
        components: pcQuote.components
            .filter(c => c.selected)
            .map(c => ({
                category: c.category,
                productName: c.productName,
                productPrice: c.productPrice
            })),
        createdAt: pcQuote.createdAt.toISOString(),
        ipAddress: pcQuote.ipAddress,
        source: pcQuote.source
    }).then(result => {
        if (!result.success && !result.skipped) {
            console.error('N8N pcQuoteGenerated workflow failed:', result.error);
        } else if (result.skipped) {
            console.warn('N8N pcQuoteGenerated skipped:', result.reason);
        } else {
        }
    }).catch(err => {
        console.error('Unexpected error triggering N8N:', err);
    });

    // Trigger N8N workflow - Quote Confirmation (User-facing)
    N8NService.run("pcQuoteConfirmation", {
        event: "pcQuoteConfirmation",
        quoteId: pcQuote._id.toString(),
        customerName: pcQuote.customer.name,
        customerEmail: pcQuote.customer.email,
        customerPhone: pcQuote.customer.phone || '',
        status: pcQuote.status,
        componentCount: pcQuote.components.filter(c => c.selected).length,
        components: pcQuote.components
            .filter(c => c.selected)
            .map(c => ({
                category: c.category,
                productName: c.productName,
                productPrice: c.productPrice
            })),
        createdAt: pcQuote.createdAt.toISOString(),
        confirmedAt: new Date().toISOString(),
        source: pcQuote.source
    }).then(result => {
        if (!result.success && !result.skipped) {
            console.error('N8N pcQuoteConfirmation workflow failed:', result.error);
        } else if (result.skipped) {
            console.warn('N8N pcQuoteConfirmation skipped:', result.reason);
        } else {
        }
    }).catch(err => {
        console.error('Unexpected error triggering N8N:', err);
    });


    // Also trigger requirements confirmation if this is from the form
    if (metadata.source === 'requirements_form' || req.body.requirementId) {
        N8NService.run("pcRequirementsConfirmation", {
            event: "pcRequirementsConfirmation",
            email: pcQuote.customer.email,
            customerName: pcQuote.customer.name,
            quoteId: pcQuote._id.toString(),
            totalEstimated: pcQuote.totalEstimated,
            requirementId: req.body.requirementId || pcQuote._id.toString(),
            estimatedContactTime: "24 hours",
            submittedAt: pcQuote.createdAt.toISOString()
        }).catch(err => console.error("N8N pcRequirementsConfirmation failed:", err));
    }

    const responseData = {
        success: true,
        message: 'Your PC quote request has been submitted successfully! We will contact you within 24 hours.',
        quoteId: pcQuote._id,
        totalEstimated: pcQuote.totalEstimated
        // Removed expiresIn and quoteExpiry fields
    };

    res.status(201).json(responseData);
});


// Get all PC quotes with advanced filtering (Admin)
exports.getPCQuotes = catchAsyncErrors(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        status,
        search,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minPrice,
        maxPrice
    } = req.query;

    // Build filter
    const filter = {};

    // Status filter
    if (status && status !== 'all') {
        const validStatuses = ['pending', 'contacted', 'quoted', 'accepted', 'rejected', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return next(new ErrorHandler('Invalid status parameter', 400));
        }
        filter.status = status;
    }

    // Search filter
    if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
            { 'customer.name': searchRegex },
            { 'customer.email': searchRegex },
            { 'customer.phone': searchRegex }
        ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            if (isNaN(fromDate.getTime())) {
                return next(new ErrorHandler('Invalid dateFrom parameter', 400));
            }
            filter.createdAt.$gte = fromDate;
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            if (isNaN(toDate.getTime())) {
                return next(new ErrorHandler('Invalid dateTo parameter', 400));
            }
            toDate.setHours(23, 59, 59, 999); // End of day
            filter.createdAt.$lte = toDate;
        }
    }

    // Price range filter
    if (minPrice || maxPrice) {
        filter.totalEstimated = {};
        if (minPrice) {
            const min = Number(minPrice);
            if (isNaN(min) || min < 0) {
                return next(new ErrorHandler('Invalid minPrice parameter', 400));
            }
            filter.totalEstimated.$gte = min;
        }
        if (maxPrice) {
            const max = Number(maxPrice);
            if (isNaN(max) || max < 0) {
                return next(new ErrorHandler('Invalid maxPrice parameter', 400));
            }
            filter.totalEstimated.$lte = max;
        }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    const validSortFields = ['createdAt', 'totalEstimated', 'customer.name', 'status', 'quoteExpiry'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortConfig[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [quotes, totalQuotes] = await Promise.all([
        PCQuote.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(limitNum)
            .populate('assignedTo', 'name email')
            .select('-__v')
            .lean(),
        PCQuote.countDocuments(filter)
    ]);

    // Transform quotes for admin view
    const transformedQuotes = quotes.map(quote => ({
        ...quote,
        isExpired: quote.quoteExpiry < new Date(),
        selectedComponents: quote.components.filter(comp => comp.selected).length,
        totalComponents: quote.components.length
    }));

    res.status(200).json({
        success: true,
        quotes: transformedQuotes,
        pagination: {
            total: totalQuotes,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalQuotes / limitNum)
        },
        filters: {
            status: status || 'all',
            search: search || '',
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            minPrice: minPrice ? Number(minPrice) : null,
            maxPrice: maxPrice ? Number(maxPrice) : null
        }
    });
});

// Get single PC quote with enhanced data (Admin)
exports.getPCQuote = catchAsyncErrors(async (req, res, next) => {
    const quote = await PCQuote.findById(req.params.id)
        .populate('assignedTo', 'name email')
        .lean();

    if (!quote) {
        return next(new ErrorHandler('PC quote not found', 404));
    }

    // Enrich components with full product details
    const enrichedComponents = await Promise.all(
        quote.components.map(async (component) => {
            if (component.productId) {
                try {
                    const product = await Product.findById(component.productId)
                        .select('name slug images basePrice mrp specifications brand stockQuantity')
                        .populate('brand', 'name')
                        .lean();

                    return {
                        ...component,
                        productDetails: product || null
                    };
                } catch (error) {
                    return component;
                }
            }
            return component;
        })
    );

    res.status(200).json({
        success: true,
        quote: {
            ...quote,
            components: enrichedComponents,
            isExpired: quote.quoteExpiry < new Date(),
            daysUntilExpiry: Math.ceil((quote.quoteExpiry - new Date()) / (1000 * 60 * 60 * 24))
        }
    });
});

// Add to customPCController.js
exports.getPCAnalytics = catchAsyncErrors(async (req, res, next) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
        basicStats,
        weeklyQuotes,
        topComponents,
        popularCategories,
        conversionStats
    ] = await Promise.all([
        // Basic stats from existing method
        PCQuote.getStats(),
        // Weekly quotes (last 8 weeks)
        PCQuote.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        $week: '$createdAt'
                    },
                    quotes: { $sum: 1 },
                    conversions: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['approved', 'converted']] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 8 }
        ]),
        // Top components
        PCQuote.aggregate([
            { $unwind: '$components' },
            {
                $group: {
                    _id: {
                        componentId: '$components.component',
                        category: '$components.category'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id.componentId',
                    foreignField: '_id',
                    as: 'componentInfo'
                }
            },
            { $unwind: '$componentInfo' },
            {
                $group: {
                    _id: '$_id.category',
                    topComponent: {
                        $first: {
                            component: '$componentInfo.name',
                            count: '$count'
                        }
                    }
                }
            },
            { $sort: { 'topComponent.count': -1 } }
        ]),
        // Popular categories
        PCQuote.aggregate([
            { $unwind: '$components' },
            {
                $group: {
                    _id: '$components.category',
                    usageCount: { $sum: 1 }
                }
            },
            { $sort: { usageCount: -1 } },
            { $limit: 5 }
        ]),
        // Conversion stats
        PCQuote.aggregate([
            {
                $group: {
                    _id: null,
                    totalQuotes: { $sum: 1 },
                    convertedQuotes: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['approved', 'converted']] }, 1, 0]
                        }
                    }
                }
            }
        ])
    ]);

    const conversionRate = conversionStats[0] ?
        (conversionStats[0].convertedQuotes / conversionStats[0].totalQuotes) * 100 : 0;

    res.status(200).json({
        success: true,
        data: {
            totalQuotes: basicStats.total,
            approvedQuotes: basicStats.byStatus.find(s => s.status === 'approved')?.count || 0,
            expiredQuotes: basicStats.expired,
            pendingQuotes: basicStats.pending,
            conversionRate: Math.round(conversionRate * 100) / 100,
            topComponents: topComponents.map(item => ({
                category: item._id,
                component: item.topComponent.component,
                count: item.topComponent.count
            })),
            popularCategories: popularCategories.map(item => ({
                category: item._id,
                usageCount: item.usageCount
            })),
            weeklyQuotes: weeklyQuotes.map(week => ({
                week: `Week ${week._id}`,
                quotes: week.quotes,
                conversions: week.conversions
            }))
        }
    });
});
// Update quote status with validation (Admin)
exports.updateQuoteStatus = catchAsyncErrors(async (req, res, next) => {
    const { status, adminNotes, assignedTo } = req.body;

    const quote = await PCQuote.findById(req.params.id);
    if (!quote) {
        return next(new ErrorHandler('PC quote not found', 404));
    }

    // Validate status transition
    const validTransitions = {
        pending: ['contacted', 'cancelled'],
        contacted: ['quoted', 'cancelled'],
        quoted: ['accepted', 'rejected', 'cancelled'],
        accepted: ['cancelled'],
        rejected: [],
        cancelled: []
    };

    if (status && status !== quote.status) {
        if (!validTransitions[quote.status]?.includes(status)) {
            return next(new ErrorHandler(`Invalid status transition from ${quote.status} to ${status}`, 400));
        }
        quote.status = status;
    }

    if (adminNotes !== undefined) {
        if (adminNotes.length > 2000) {
            return next(new ErrorHandler('Admin notes cannot exceed 2000 characters', 400));
        }
        quote.adminNotes = adminNotes.trim();
    }

    if (assignedTo !== undefined) {
        quote.assignedTo = assignedTo || null;
    }

    await quote.save();

    res.status(200).json({
        success: true,
        message: 'Quote updated successfully',
        quote
    });
});

// Get quote statistics (Admin)
exports.getQuoteStats = catchAsyncErrors(async (req, res, next) => {
    const stats = await PCQuote.getStats();

    res.status(200).json({
        success: true,
        stats
    });
});

// Delete quote (Admin)
exports.deleteQuote = catchAsyncErrors(async (req, res, next) => {
    const quote = await PCQuote.findById(req.params.id);

    if (!quote) {
        return next(new ErrorHandler('PC quote not found', 404));
    }

    // Prevent deletion of recently created quotes
    const quoteAge = Date.now() - quote.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (quoteAge < maxAge && req.user.role !== 'super-admin') {
        return next(new ErrorHandler('Quotes cannot be deleted within 24 hours of creation', 403));
    }

    await PCQuote.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'PC quote deleted successfully'
    });
});

// Extend quote expiry (Admin)
exports.extendQuoteExpiry = catchAsyncErrors(async (req, res, next) => {
    const { days = 7 } = req.body;

    const quote = await PCQuote.findById(req.params.id);
    if (!quote) {
        return next(new ErrorHandler('PC quote not found', 404));
    }

    if (days < 1 || days > 30) {
        return next(new ErrorHandler('Extension days must be between 1 and 30', 400));
    }

    await quote.extendExpiry(days);

    res.status(200).json({
        success: true,
        message: `Quote expiry extended by ${days} days`,
        newExpiry: quote.quoteExpiry
    });
});

exports.submitPCRequirements = async (req, res) => {
    try {
        const {
            customer,
            requirements,
            source = 'requirements_form',
            metadata = {}
        } = req.body;

        // Validate required fields
        if (!customer || !customer.name || !customer.email || !customer.phone || !customer.city) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required customer information'
            });
        }

        if (!requirements || !requirements.purpose || !requirements.budget ||
            !requirements.paymentPreference || !requirements.deliveryTimeline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required PC requirements'
            });
        }

        // Create new requirements document
        const pcRequirements = new PCRequirements({
            customer: {
                name: customer.name.trim(),
                email: customer.email.trim().toLowerCase(),
                phone: customer.phone.trim(),
                city: customer.city.trim(),
                additionalNotes: customer.additionalNotes || ''
            },
            requirements: {
                purpose: requirements.purpose,
                purposeCustom: requirements.purposeCustom || '',
                budget: requirements.budget,
                budgetCustom: requirements.budgetCustom || '',
                paymentPreference: requirements.paymentPreference,
                deliveryTimeline: requirements.deliveryTimeline,
                timelineCustom: requirements.timelineCustom || ''
            },
            source,
            metadata: {
                ipAddress: req.ip || metadata.ipAddress,
                userAgent: req.get('User-Agent') || metadata.userAgent,
                deviceType: metadata.deviceType || 'web'
            }
        });

        await pcRequirements.save();

        // Trigger N8N workflows asynchronously
        // Admin notification
        N8NService.run("pcRequirementsSubmitted", {
            event: "pcRequirementsSubmitted",
            requirementId: pcRequirements._id.toString(),
            customerName: pcRequirements.customer.name,
            customerEmail: pcRequirements.customer.email,
            customerPhone: pcRequirements.customer.phone,
            customerCity: pcRequirements.customer.city,
            purpose: pcRequirements.requirements.purpose,
            budget: pcRequirements.requirements.budget,
            paymentPreference: pcRequirements.requirements.paymentPreference,
            deliveryTimeline: pcRequirements.requirements.deliveryTimeline,
            additionalNotes: pcRequirements.customer.additionalNotes,
            source: pcRequirements.source,
            createdAt: pcRequirements.createdAt,
            status: pcRequirements.status
        }).catch(err => console.error("N8N pcRequirementsSubmitted failed:", err));

        // Customer confirmation
        N8NService.run("pcRequirementsConfirmation", {
            event: "pcRequirementsConfirmation",
            email: pcRequirements.customer.email,
            customerName: pcRequirements.customer.name,
            requirementId: pcRequirements._id.toString(),
            purpose: pcRequirements.requirements.purpose,
            budget: pcRequirements.requirements.budget,
            estimatedContactTime: "24 hours",
            submittedAt: pcRequirements.createdAt
        }).catch(err => console.error("N8N pcRequirementsConfirmation failed:", err));

        res.status(201).json({
            success: true,
            message: 'PC requirements submitted successfully',
            requirementId: pcRequirements._id,
            data: {
                id: pcRequirements._id,
                customerName: pcRequirements.customer.name,
                status: pcRequirements.status,
                estimatedContactTime: '24 hours'
            }
        });
    } catch (error) {
        console.error('Error submitting PC requirements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit requirements',
            error: error.message
        });
    }
};


exports.getAllPCRequirements = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } },
                { 'customer.city': { $regex: search, $options: 'i' } },
                { 'requirements.purpose': { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [requirements, total] = await Promise.all([
            PCRequirements.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('assignedTo', 'name email')
                .lean(),
            PCRequirements.countDocuments(query)
        ]);

        res.json({
            success: true,
            requirements,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            },
            filters: {
                status,
                search,
                sortBy,
                sortOrder
            }
        });
    } catch (error) {
        console.error('Error fetching PC requirements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requirements'
        });
    }
};


exports.getPCRequirement = async (req, res) => {
    try {
        const requirement = await PCRequirements.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('recommendations.product', 'name price images');

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message: 'Requirement not found'
            });
        }

        res.json({
            success: true,
            requirement
        });
    } catch (error) {
        console.error('Error fetching PC requirement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requirement'
        });
    }
};


exports.updatePCRequirement = async (req, res) => {
    try {
        const { status, adminNotes, assignedTo, recommendations, estimatedTotal } = req.body;
        const requirement = await PCRequirements.findById(req.params.id);

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message: 'Requirement not found'
            });
        }

        // Update fields if provided
        if (status && requirement.status !== status) {
            requirement.status = status;
            if (status === 'quoted') {
                requirement.quotedAt = new Date();
            } else if (status === 'completed') {
                requirement.completedAt = new Date();
            }
        }

        if (adminNotes !== undefined) requirement.adminNotes = adminNotes;
        if (assignedTo !== undefined) requirement.assignedTo = assignedTo;
        if (recommendations) requirement.recommendations = recommendations;
        if (estimatedTotal !== undefined) requirement.estimatedTotal = estimatedTotal;

        // Add contact attempt if status changed to contacted
        if (status === 'contacted') {
            requirement.contactAttempts.push({
                date: new Date(),
                method: 'call',
                notes: adminNotes || 'Initial contact',
                admin: req.user._id
            });
        }

        await requirement.save();

        res.json({
            success: true,
            message: 'Requirement updated successfully',
            requirement
        });
    } catch (error) {
        console.error('Error updating PC requirement:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update requirement'
        });
    }
};


exports.getPCRequirementsStats = async (req, res) => {
    try {
        const [statusStats, total, newCount] = await Promise.all([
            PCRequirements.getStats(),
            PCRequirements.countDocuments(),
            PCRequirements.countDocuments({ status: 'new' })
        ]);

        // Get budget distribution
        const budgetStats = await PCRequirements.aggregate([
            {
                $group: {
                    _id: '$requirements.budget',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get purpose distribution
        const purposeStats = await PCRequirements.aggregate([
            {
                $group: {
                    _id: '$requirements.purpose',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            stats: {
                byStatus: statusStats,
                byBudget: budgetStats,
                byPurpose: purposeStats,
                total,
                new: newCount,
                conversionRate: total > 0 ?
                    ((await PCRequirements.countDocuments({ status: 'completed' })) / total * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching PC requirements stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats'
        });
    }
};