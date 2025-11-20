// backend/config/razorpay.js
const Razorpay = require('razorpay');
const path = require('path');

// Load environment variables from config.env
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Simple validation with helpful error message
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay environment variables are missing!');
    console.error('Please add to backend/config/config.env:');
    console.error('RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx');
    console.error('RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx');
    console.error('You can get these from: https://dashboard.razorpay.com/app/keys');

    // Don't throw error, just warn and continue (for development)
    console.warn('⚠️ Continuing with placeholder values for now...');
}

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

console.log('✅ Razorpay configured successfully');
console.log('   Mode:', process.env.NODE_ENV || 'development');

module.exports = razorpayInstance;