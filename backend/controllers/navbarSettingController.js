const NavbarSetting = require('../models/NavbarSetting');
const fs = require('fs');
const path = require('path');

// Helper function to delete old logo file
const deleteOldLogo = async (logo) => {
    if (logo && logo.filename) {
        try {
            const filePath = path.join(__dirname, '../public/uploads/logo', logo.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting old logo file:', error);
        }
    }
};

// Get navbar settings
exports.getNavbarSettings = async (req, res) => {
    try {
        let settings = await NavbarSetting.findOne().sort({ createdAt: -1 });

        if (!settings) {
            settings = await NavbarSetting.create({});
        }

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching navbar settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch navbar settings',
            error: error.message
        });
    }
};

// Update navbar settings
exports.updateNavbarSettings = async (req, res) => {
    try {
        const {
            siteName,
            fontFamily,
            primaryColor,
            secondaryColor,
            tagline
        } = req.body;

        // Validate required fields
        if (!siteName) {
            return res.status(400).json({
                success: false,
                message: 'Site name is required'
            });
        }

        let logoData = null;

        // Handle logo upload if provided
        if (req.file) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            logoData = {
                url: `${baseUrl}/uploads/logo/${req.file.filename}`,
                altText: siteName || 'Site Logo',
                filename: req.file.filename
            };
        }

        // Find existing settings
        let settings = await NavbarSetting.findOne().sort({ createdAt: -1 });

        if (!settings) {
            // Create new settings
            settings = await NavbarSetting.create({
                logo: logoData || {
                    url: '/uploads/logo/default-logo.png',
                    altText: siteName || 'Site Logo',
                    filename: null
                },
                siteName,
                fontFamily: fontFamily || 'font-sans',
                primaryColor: primaryColor || '#2c2358',
                secondaryColor: secondaryColor || '#544D89',
                tagline: tagline || 'Premium Electronics',
                updatedBy: req.user.id
            });
        } else {
            const updateData = {
                siteName,
                fontFamily: fontFamily || settings.fontFamily,
                primaryColor: primaryColor || settings.primaryColor,
                secondaryColor: secondaryColor || settings.secondaryColor,
                tagline: tagline || settings.tagline,
                updatedBy: req.user.id
            };

            // Only update logo if new one is provided
            if (logoData) {
                // Delete old logo file if exists
                await deleteOldLogo(settings.logo);
                updateData.logo = logoData;
            }

            settings = await NavbarSetting.findByIdAndUpdate(
                settings._id,
                updateData,
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Navbar settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating navbar settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update navbar settings',
            error: error.message
        });
    }
};

// Reset navbar settings to default
exports.resetNavbarSettings = async (req, res) => {
    try {
        let settings = await NavbarSetting.findOne().sort({ createdAt: -1 });

        if (!settings) {
            settings = await NavbarSetting.create({});
        } else {
            // Delete old logo file if exists
            await deleteOldLogo(settings.logo);

            // Reset to defaults
            settings = await NavbarSetting.findByIdAndUpdate(
                settings._id,
                {
                    logo: {
                        url: '/uploads/logo/default-logo.png',
                        altText: 'iTech Computers',
                        filename: null
                    },
                    siteName: 'iTech Computers',
                    fontFamily: 'font-sans',
                    primaryColor: '#2c2358',
                    secondaryColor: '#544D89',
                    tagline: 'Premium Electronics',
                    updatedBy: req.user.id
                },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Navbar settings reset to defaults',
            settings
        });
    } catch (error) {
        console.error('Error resetting navbar settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset navbar settings',
            error: error.message
        });
    }
};