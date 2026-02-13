const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary configuration missing. Please check .env file.');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload Video to Cloudinary
const uploadVideoToCloudinary = (filePath, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: folder,
            chunk_size: 6000000, // 6MB chunks
            eager: [
                { width: 300, height: 300, crop: "pad", audio_codec: "none" },
                { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }
            ],
            eager_async: true
        }, (error, result) => {
            if (error) return reject(error);
            resolve({
                public_id: result.public_id,
                url: result.secure_url,
                duration: result.duration,
                format: result.format,
                bytes: result.bytes
            });
        });
    });
};

// Upload Image to Cloudinary (for thumbnails)
const uploadImageToCloudinary = (filePath, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(filePath, {
            resource_type: "image",
            folder: folder
        }, (error, result) => {
            if (error) return reject(error);
            resolve({
                public_id: result.public_id,
                url: result.secure_url
            });
        });
    });
};

// Delete from Cloudinary
const deleteFromCloudinary = (publicId, resourceType = 'video') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

module.exports = {
    uploadVideoToCloudinary,
    uploadImageToCloudinary,
    deleteFromCloudinary
};
