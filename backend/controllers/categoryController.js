const Category = require("../models/categoryModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncError");

// 🆕 Create new category
exports.createCategory = catchAsyncErrors(async (req, res, next) => {
    const { name, description, parentCategory, metaTitle, metaDescription, metaKeywords } = req.body;

    if (!name) {
        return next(new ErrorHandler("Category name is required", 400));
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
        return next(new ErrorHandler("Category already exists", 400));
    }

    const category = await Category.create({
        name,
        slug,
        description,
        parentCategory: parentCategory || null,
        metaTitle,
        metaDescription,
        metaKeywords,
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
    });
});

// 📋 Get all categories (Admin)
exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
    const categories = await Category.find().populate("parentCategory", "name");
    res.status(200).json({
        success: true,
        count: categories.length,
        categories,
    });
});

// 🧾 Get single category by slug
exports.getCategoryBySlug = catchAsyncErrors(async (req, res, next) => {
    const category = await Category.findOne({ slug: req.params.slug }).populate("parentCategory", "name");
    if (!category) {
        return next(new ErrorHandler("Category not found", 404));
    }

    res.status(200).json({
        success: true,
        category,
    });
});
