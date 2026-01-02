const mongoose = require('mongoose');

const navbarSettingSchema = new mongoose.Schema({
    logo: {
        url: {
            type: String,
            default: '/uploads/logo/default-logo.png'
        },
        altText: {
            type: String,
            default: 'Site Logo'
        },
        filename: String
    },
    siteName: {
        type: String,
        required: true,
        default: 'iTech Computers'
    },
    fontFamily: {
        type: String,
        default: 'font-sans'
    },
    primaryColor: {
        type: String,
        default: '#2c2358'
    },
    secondaryColor: {
        type: String,
        default: '#544D89'
    },
    tagline: {
        type: String,
        default: 'Premium Electronics'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('NavbarSetting', navbarSettingSchema);