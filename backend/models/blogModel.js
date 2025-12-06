const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
    {
        // Your actual MongoDB fields (from n8n)
        'Meta-tags': {
            type: String,
            default: "",
            trim: true,
        },

        Title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },

        Html: {
            type: String,
            default: "",
        },

        Slug: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 255,
        },

        Category: {
            type: String, // Changed from [String] to String since your data shows null
            default: null,
        },

        Tags: {
            type: [String],
            default: [],
        },

        Status: {
            type: String,
            enum: ["Draft", "Review", "Published", "Archived"], // Capitalized to match your data
            default: "Draft",
        },

        // Additional fields you want to add (not in your current data but good to have)
        excerpt: {
            type: String,
            maxlength: 500,
            default: "",
        },

        author: {
            type: String,
            default: "AI Generated", // Default from n8n
        },

        featured: {
            type: Boolean,
            default: false,
        },

        image_url: {
            type: String,
            default: null,
        },

        published_at: {
            type: Date,
            default: null,
        },

        // Workflow tracking
        workflow: {
            auto_generated: { type: Boolean, default: false },
            generated_at: { type: Date, default: null },
            reviewed_by: { type: String, default: null },
            reviewed_at: { type: Date, default: null },
            quality_checks: { type: mongoose.Schema.Types.Mixed, default: {} },
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

// Pre-save middleware to auto-generate slug if not provided
blogSchema.pre('save', function (next) {
    if (!this.Slug && this.Title) {
        this.Slug = slugify(this.Title, {
            lower: true,
            strict: true,
            trim: true
        });

        // Add timestamp to ensure uniqueness
        this.Slug = `${this.Slug}-${Date.now()}`;
    }

    // Auto-generate excerpt from Meta-tags if not provided
    if (!this.excerpt && this['Meta-tags']) {
        this.excerpt = this['Meta-tags'].substring(0, 250);
    }

    // Set published_at when status changes to Published
    if (this.isModified('Status') && this.Status === 'Published' && !this.published_at) {
        this.published_at = new Date();
    }

    // Set workflow data for new documents
    if (this.isNew && !this.workflow.auto_generated) {
        this.workflow = {
            auto_generated: true,
            generated_at: new Date(),
            reviewed_by: null,
            reviewed_at: null,
            quality_checks: {}
        };
    }

    next();
});

// Virtual for reading time (using Html field)
blogSchema.virtual("reading_time").get(function () {
    if (!this.Html) return 0;
    // Remove ```html markers for accurate word count
    const cleanHtml = this.Html.replace(/^```html\s*/i, '').replace(/```$/g, '');
    return Math.ceil(cleanHtml.split(/\s+/).length / 200);
});

// Virtual for getting lowercase field names (for compatibility)
blogSchema.virtual('meta_tags').get(function () {
    return this['Meta-tags'];
});

blogSchema.virtual('title').get(function () {
    return this.Title;
});

blogSchema.virtual('html').get(function () {
    return this.Html;
});

blogSchema.virtual('slug').get(function () {
    return this.Slug;
});

blogSchema.virtual('category').get(function () {
    return this.Category ? [this.Category] : []; // Convert to array for compatibility
});

blogSchema.virtual('tags').get(function () {
    return this.Tags;
});

blogSchema.virtual('status').get(function () {
    return this.Status.toLowerCase(); // Convert to lowercase for compatibility
});

// Indexes
blogSchema.index({ Slug: 1 }, { unique: true });
blogSchema.index({ Status: 1 });
blogSchema.index({ published_at: -1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ Category: 1 });
blogSchema.index({ Tags: 1 });

// Text index for search
blogSchema.index({
    Title: 'text',
    'Meta-tags': 'text',
    Html: 'text'
});

// Method to clean HTML
blogSchema.methods.cleanHtml = function () {
    if (!this.Html) return '';
    return this.Html
        .replace(/^```html\s*/i, '')
        .replace(/```$/g, '')
        .trim();
};

// Method to get formatted blog for frontend
blogSchema.methods.toFrontendFormat = function () {
    const blog = this.toObject();

    // Add virtuals
    blog.meta_tags = this['Meta-tags'];
    blog.title = this.Title;
    blog.html = this.cleanHtml();
    blog.slug = this.Slug;
    blog.category = this.Category ? [this.Category] : [];
    blog.tags = this.Tags;
    blog.status = this.Status.toLowerCase();
    blog.reading_time = this.reading_time;

    return blog;
};

module.exports = mongoose.model("Blog", blogSchema);
