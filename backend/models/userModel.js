const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Custom Error Classes
class AuthError extends Error {
    constructor(message, code = 'AUTH_ERROR') {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }
}

class ValidationError extends Error {
    constructor(message, field, code = 'VALIDATION_ERROR') {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.code = code;
    }
}

class AccountError extends Error {
    constructor(message, code = 'ACCOUNT_ERROR') {
        super(message);
        this.name = 'AccountError';
        this.code = code;
    }
}

const userSchema = new mongoose.Schema({
    // ==================== BASIC PROFILE ====================
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters'],
        validate: {
            validator: function (v) {
                return /^[a-zA-Z\s]{2,50}$/.test(v);
            },
            message: 'First name must be 2-50 characters long and contain only letters and spaces'
        }
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        validate: {
            validator: function (v) {
                if (!v) return true; // Optional field
                return /^[a-zA-Z\s]{1,50}$/.test(v);
            },
            message: 'Last name must be 1-50 characters long and contain only letters and spaces'
        }
    },
    // ✅ ADDED: Username field that combines first and last name
    username: {
        type: String,
    },
    email: {
        type: String,
        unique: [true, 'Email already exists'],
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: false,
        select: false,
        minlength: [8, 'Password must be at least 8 characters long']
    },
    // Simple version - just check if it's a string
    avatar: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true; // Optional field
                return typeof v === 'string' && v.length > 0;
            },
            message: 'Avatar must be a valid string'
        }
    },

    // ==================== EMAIL VERIFICATION (For n8n) ====================
    emailVerified: {
        type: Boolean,
        default: true
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },

    // ==================== PASSWORD RESET (For n8n) ====================
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordTokenExpire: {
        type: Date,
        select: false
    },

    // ==================== ACCOUNT SECURITY ====================
    role: {
        type: String,
        enum: {
            values: ["user", "admin"],
            message: 'Role must be either user or admin'
        },
        default: "user"
    },
    status: {
        type: String,
        enum: {
            values: ["active", "inactive", "suspended"],
            message: 'Status must be either active, inactive, or suspended'
        },
        default: "active"
    },

    // ==================== GOOGLE LOGIN ====================
    socialLogins: [{
        provider: {
            type: String,
            enum: {
                values: ['google'],
                message: 'Social login provider must be google'
            },
            required: [true, 'Social login provider is required']
        },
        providerId: {
            type: String,
            required: [true, 'Provider ID is required'],
            validate: {
                validator: function (v) {
                    return v && v.length > 5;
                },
                message: 'Provider ID must be valid'
            }
        },
        email: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: 'Social login email must be valid'
            }
        },
        displayName: {
            type: String,
            maxlength: [100, 'Display name cannot exceed 100 characters']
        },
        photoURL: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: 'Photo URL must be valid'
            }
        },
        accessToken: {
            type: String,
            select: false
        },
        refreshToken: {
            type: String,
            select: false
        },
        idToken: {
            type: String,
            select: false
        },
        connectedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Add this to your userSchema, before the timestamps
    addresses: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        type: {
            type: String,
            enum: ["home", "work", "other"],
            default: "home"
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^[6-9]\d{9}$/.test(v);
                },
                message: 'Invalid Indian phone number'
            }
        },
        email: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: 'Invalid email address'
            }
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true
        },
        addressLine2: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        pincode: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^\d{6}$/.test(v);
                },
                message: 'Invalid pincode (must be 6 digits)'
            }
        },
        country: {
            type: String,
            default: "India",
            trim: true
        },
        landmark: {
            type: String,
            trim: true
        }
    }],

    // Add default address reference
    defaultAddressId: {
        type: mongoose.Schema.Types.ObjectId
    },

    // ==================== E-COMMERCE (Basic - Detailed schemas later) ====================
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart"
    },

    wishlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wishlist"
    },

    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }]


}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// ==================== VIRTUAL FIELDS ====================
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('isGoogleUser').get(function () {
    return this.socialLogins && this.socialLogins.some(login => login.provider === 'google');
});
userSchema.pre('save', function (next) {
    // Only validate password if it's being modified and user is not a social login user
    if (this.isModified('password') && this.password &&
        (!this.socialLogins || this.socialLogins.length === 0)) {

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(this.password)) {
            return next(new ValidationError(
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'password'
            ));
        }
    }
    next();
});

// ✅ KEEP ONLY ONE: Hash password before save (only for non-social logins)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(new AuthError('Failed to hash password', 'PASSWORD_HASH_ERROR'));
    }
});

// ✅ KEEP: Handle username uniqueness with numbers
userSchema.pre('save', async function (next) {
    if (!this.isModified('username') || !this.username) return next();

    try {
        let finalUsername = this.username;
        let counter = 1;
        let isUnique = false;

        while (!isUnique && counter < 100) { // Safety limit
            const existingUser = await this.constructor.findOne({
                username: finalUsername,
                _id: { $ne: this._id } // Exclude current user
            });

            if (!existingUser) {
                isUnique = true;
                this.username = finalUsername;
            } else {
                // Add number to make it unique
                finalUsername = `${this.username.substring(0, 25)}${counter}`;
                counter++;
            }
        }

        if (!isUnique) {
            // Fallback: use email username + timestamp
            const emailUsername = this.email.split('@')[0].substring(0, 20);
            const timestamp = Date.now().toString().slice(-4);
            this.username = `${emailUsername}${timestamp}`;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }); // ✅ ADDED: Index for username
userSchema.index({ 'socialLogins.provider': 1, 'socialLogins.providerId': 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: 1 });

// ==================== MIDDLEWARE ====================



// ✅ ADDED: Auto-generate username from first and last name
userSchema.pre('save', function (next) {
    // Only generate username if it doesn't exist and we have first name
    if (!this.username && this.firstName) {
        const baseUsername = `${this.firstName}${this.lastName ? this.lastName : ''}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
            .substring(0, 25); // Limit to 25 chars to leave room for numbers

        if (baseUsername.length >= 3) {
            this.username = baseUsername;
        }
    }
    next();
});
// Auto-verify email for Google users
userSchema.pre('save', function (next) {
    if (this.isGoogleUser && !this.emailVerified) {
        this.emailVerified = true;
    }
    next();
});

// Validate social logins array
userSchema.pre('save', function (next) {
    if (this.socialLogins && this.socialLogins.length > 3) {
        return next(new ValidationError('Cannot have more than 3 social logins', 'socialLogins'));
    }
    next();
});

// ==================== INSTANCE METHODS ====================

// 🔑 JWT TOKEN
userSchema.methods.getJwtToken = function () {
    return jwt.sign(
        {
            id: this._id // Only include user ID
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_TIME || '7d'
        }
    );
};

// 🔍 PASSWORD VALIDATION
userSchema.methods.isValidPassword = async function (enteredPassword) {
    if (!this.password) {
        throw new AuthError('Password login not available for social login users', 'SOCIAL_LOGIN_PASSWORD');
    }

    if (!enteredPassword) {
        throw new ValidationError('Password is required', 'password');
    }

    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        throw new AuthError('Failed to validate password', 'PASSWORD_VALIDATION_ERROR');
    }
};

// ✉️ EMAIL VERIFICATION TOKEN (For n8n)
userSchema.methods.generateEmailVerificationToken = function () {
    if (this.emailVerified) {
        throw new AccountError('Email is already verified', 'EMAIL_ALREADY_VERIFIED');
    }

    if (this.isGoogleUser) {
        throw new AccountError('Google users do not require email verification', 'GOOGLE_USER_VERIFICATION');
    }

    const token = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return token;
};

// 🔄 PASSWORD RESET TOKEN (For n8n)
userSchema.methods.generatePasswordResetToken = function () {
    if (this.isGoogleUser) {
        throw new AuthError('Password reset not available for Google login users', 'GOOGLE_USER_PASSWORD_RESET');
    }

    if (this.resetPasswordToken && this.resetPasswordTokenExpire > Date.now()) {
        throw new AuthError('Password reset token already active', 'ACTIVE_RESET_TOKEN');
    }

    const token = crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    return token;
};



// 🛒 BASIC CART METHODS (Detailed logic in separate cart schema later)
userSchema.methods.addToCart = async function (productId, variantId, quantity = 1) {
    if (!productId) {
        throw new ValidationError('Product ID is required', 'productId');
    }

    if (quantity < 1 || quantity > 100) {
        throw new ValidationError('Quantity must be between 1 and 100', 'quantity');
    }

    const itemIndex = this.cart.findIndex(
        item => item.product.toString() === productId.toString() &&
            item.variant?.toString() === variantId?.toString()
    );

    if (itemIndex > -1) {
        const newQuantity = this.cart[itemIndex].quantity + quantity;
        if (newQuantity > 100) {
            throw new ValidationError('Total quantity cannot exceed 100', 'quantity');
        }
        this.cart[itemIndex].quantity = newQuantity;
    } else {
        if (this.cart.length >= 50) {
            throw new ValidationError('Cart cannot have more than 50 items', 'cart');
        }
        this.cart.push({
            product: productId,
            variant: variantId,
            quantity,
            addedAt: new Date()
        });
    }

    return this.save();
};

userSchema.methods.removeFromCart = async function (productId, variantId = null) {
    if (!productId) {
        throw new ValidationError('Product ID is required', 'productId');
    }

    const initialLength = this.cart.length;

    if (variantId) {
        this.cart = this.cart.filter(
            item => !(item.product.toString() === productId.toString() &&
                item.variant?.toString() === variantId.toString())
        );
    } else {
        this.cart = this.cart.filter(
            item => item.product.toString() !== productId.toString()
        );
    }

    if (this.cart.length === initialLength) {
        throw new ValidationError('Item not found in cart', 'cart');
    }

    return this.save();
};

// ==================== STATIC METHODS ====================

// ✅ ADDED: Method to generate username from name
userSchema.statics.generateUsername = function (firstName, lastName = '') {
    if (!firstName) {
        throw new ValidationError('First name is required to generate username', 'firstName');
    }

    const baseUsername = `${firstName}${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
        .substring(0, 25); // Limit to 25 chars

    if (baseUsername.length < 3) {
        throw new ValidationError('Name is too short to generate username', 'firstName');
    }

    return baseUsername;
};

// ✅ ADDED: Method to find available username
userSchema.statics.findAvailableUsername = async function (baseUsername) {
    let finalUsername = baseUsername;
    let counter = 1;

    while (counter < 100) { // Safety limit
        const existingUser = await this.findOne({ username: finalUsername });

        if (!existingUser) {
            return finalUsername;
        }

        // Add number to make it unique
        finalUsername = `${baseUsername.substring(0, 25)}${counter}`;
        counter++;
    }

    // Fallback: add timestamp
    const timestamp = Date.now().toString().slice(-4);
    return `${baseUsername.substring(0, 20)}${timestamp}`;
};

userSchema.statics.findByEmail = function (email) {
    if (!email) {
        throw new ValidationError('Email is required', 'email');
    }
    return this.findOne({ email: email.toLowerCase() });
};

// ✅ ADDED: Find by username
userSchema.statics.findByUsername = function (username) {
    if (!username) {
        throw new ValidationError('Username is required', 'username');
    }
    return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByGoogleId = function (googleId) {
    if (!googleId) {
        throw new ValidationError('Google ID is required', 'googleId');
    }
    return this.findOne({
        'socialLogins.provider': 'google',
        'socialLogins.providerId': googleId
    });
};

// In your User model - fix the findOrCreateGoogleUser method
userSchema.statics.findOrCreateGoogleUser = async function (googleProfile) {
    if (!googleProfile || !googleProfile.id || !googleProfile.email) {
        throw new ValidationError('Invalid Google profile data', 'googleProfile');
    }

    let user = await this.findByGoogleId(googleProfile.id);

    if (!user) {
        user = await this.findByEmail(googleProfile.email);

        if (user) {
            return user.addGoogleLogin(googleProfile);
        } else {
            // ✅ FIX: Better name extraction from Google profile
            const fullName = googleProfile.name || '';
            let firstName = 'User';
            let lastName = '';

            // Extract first and last name properly
            if (fullName) {
                const nameParts = fullName.split(' ');
                firstName = nameParts[0] || 'User';
                lastName = nameParts.slice(1).join(' ') || '';
            } else {
                // Fallback to givenName and familyName
                firstName = googleProfile.givenName || 'User';
                lastName = googleProfile.familyName || '';
            }

            const baseUsername = this.generateUsername(firstName, lastName);
            const username = await this.findAvailableUsername(baseUsername);

            user = await this.create({
                firstName: firstName,
                lastName: lastName,
                email: googleProfile.email,
                avatar: googleProfile.picture, // ✅ Use 'picture' not 'photos[0].value'
                username: username,
                socialLogins: []
            });

            await user.addGoogleLogin(googleProfile);
        }
    }

    return user;
};

// ✅ Also fix the addGoogleLogin method
userSchema.methods.addGoogleLogin = function (googleProfile) {
    if (!googleProfile || !googleProfile.id) {
        throw new ValidationError('Invalid Google profile data', 'googleProfile');
    }

    const googleLogin = {
        provider: 'google',
        providerId: googleProfile.id,
        email: googleProfile.email,
        displayName: googleProfile.name,
        photoURL: googleProfile.picture, // ✅ Use 'picture' not 'photos[0].value'
        connectedAt: new Date()
    };

    // Remove existing Google login if any
    this.socialLogins = this.socialLogins.filter(
        login => login.provider !== 'google'
    );

    this.socialLogins.push(googleLogin);

    // Update profile from Google data if empty
    if (!this.avatar && googleProfile.picture) {
        this.avatar = googleProfile.picture;
    }

    // ✅ Better name handling - only update if names are still default
    if (!this.firstName || this.firstName === 'User') {
        const fullName = googleProfile.name || '';
        if (fullName) {
            const nameParts = fullName.split(' ');
            this.firstName = nameParts[0] || 'User';
            this.lastName = nameParts.slice(1).join(' ') || '';
        } else {
            this.firstName = googleProfile.givenName || 'User';
            this.lastName = googleProfile.familyName || '';
        }
    }

    this.emailVerified = true;

    return this.save({ validateBeforeSave: false });
};

// Export error classes for use in controllers
userSchema.statics.AuthError = AuthError;
userSchema.statics.ValidationError = ValidationError;
userSchema.statics.AccountError = AccountError;

module.exports = mongoose.model("User", userSchema);