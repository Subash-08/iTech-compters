const axios = require('axios');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncError = require('../middlewares/catchAsyncError');

class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_BASE_URL;
        this.webhookSecret = process.env.N8N_WEBHOOK_SECRET;
        this.timeout = 10000; // 10 seconds
    }

    /**
     * Generic method to trigger n8n workflows
     */
    async triggerWorkflow(workflowType, data) {
        const webhookUrls = {
            emailVerification: `${this.baseURL}/webhook/email-verification`,
            passwordReset: `${this.baseURL}/webhook/password-reset`,
            welcomeEmail: `${this.baseURL}/webhook/welcome-email`,
            orderConfirmation: `${this.baseURL}/webhook/order-confirmation`,
            orderShipped: `${this.baseURL}/webhook/order-shipped`,
            orderDelivered: `${this.baseURL}/webhook/order-delivered`
        };

        const webhookUrl = webhookUrls[workflowType];

        if (!webhookUrl) {
            throw new ErrorHandler(`Unknown workflow type: ${workflowType}`, 500);
        }

        if (!this.baseURL) {
            console.warn('N8N_BASE_URL not configured - skipping n8n workflow trigger');
            return { success: true, skipped: true };
        }

        try {
            const response = await axios.post(webhookUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-N8N-SECRET': this.webhookSecret,
                    'User-Agent': 'E-Commerce-Backend/1.0'
                },
                timeout: this.timeout
            });

            console.log(`✅ n8n workflow triggered: ${workflowType}`, {
                workflow: workflowType,
                userId: data.userId,
                status: response.status
            });

            return {
                success: true,
                status: response.status,
                data: response.data
            };

        } catch (error) {
            // Log the error but don't break the application
            console.error(`❌ n8n workflow failed: ${workflowType}`, {
                error: error.message,
                workflow: workflowType,
                userId: data.userId,
                url: webhookUrl
            });

            // Don't throw error to prevent breaking user registration/login
            return {
                success: false,
                error: error.message,
                skipped: false
            };
        }
    }

    /**
     * Send email verification
     */
    async sendEmailVerification(user, verificationToken) {
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&userId=${user._id}`;

        const emailData = {
            workflowType: 'emailVerification',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            verificationToken: verificationToken,
            verificationUrl: verificationUrl,
            type: 'email_verification',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store'
        };

        return await this.triggerWorkflow('emailVerification', emailData);
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(user, resetToken) {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&userId=${user._id}`;

        const emailData = {
            workflowType: 'passwordReset',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            resetToken: resetToken,
            resetUrl: resetUrl,
            type: 'password_reset',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store'
        };

        return await this.triggerWorkflow('passwordReset', emailData);
    }

    /**
     * Send welcome email (after email verification)
     */
    async sendWelcomeEmail(user) {
        const welcomeData = {
            workflowType: 'welcomeEmail',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            type: 'welcome_email',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store',
            signupDate: user.createdAt
        };

        return await this.triggerWorkflow('welcomeEmail', welcomeData);
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmation(user, order) {
        const orderData = {
            workflowType: 'orderConfirmation',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            items: order.items,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            type: 'order_confirmation',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store'
        };

        return await this.triggerWorkflow('orderConfirmation', orderData);
    }

    /**
     * Send order shipped notification
     */
    async sendOrderShipped(user, order, trackingInfo) {
        const shippedData = {
            workflowType: 'orderShipped',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            trackingNumber: trackingInfo.trackingNumber,
            carrier: trackingInfo.carrier,
            trackingUrl: trackingInfo.trackingUrl,
            estimatedDelivery: trackingInfo.estimatedDelivery,
            type: 'order_shipped',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store'
        };

        return await this.triggerWorkflow('orderShipped', shippedData);
    }

    /**
     * Send order delivered notification
     */
    async sendOrderDelivered(user, order) {
        const deliveredData = {
            workflowType: 'orderDelivered',
            userId: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            deliveredAt: new Date().toISOString(),
            type: 'order_delivered',
            timestamp: new Date().toISOString(),
            appName: process.env.APP_NAME || 'Our Store'
        };

        return await this.triggerWorkflow('orderDelivered', deliveredData);
    }

    /**
     * Health check for n8n service
     */
    async healthCheck() {
        if (!this.baseURL) {
            return { healthy: false, message: 'N8N_BASE_URL not configured' };
        }

        try {
            const response = await axios.get(`${this.baseURL}/healthz`, {
                timeout: 5000
            });

            return {
                healthy: response.status === 200,
                status: response.status,
                message: 'n8n service is reachable'
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                message: 'n8n service is not reachable'
            };
        }
    }
}

// Create singleton instance
module.exports = new N8NService();