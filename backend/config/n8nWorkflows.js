module.exports = {
    // USER EVENTS WORKFLOW
    welcomeEmail: { path: "/webhook/auth-events" },
    forgotPassword: { path: "/webhook/auth-events" },
    loginAlert: { path: "/webhook/auth-events" },

    // ORDER EVENTS WORKFLOW
    orderPlaced: { path: "/webhook/order-events" },
    paymentConfirmed: { path: "/webhook/order-events" },
    orderShipped: { path: "/webhook/order-events" },
    orderDelivered: { path: "/webhook/order-events" },
    invoiceGenerated: { path: "/webhook/order-events" },

    // STOCK EVENTS WORKFLOW
    lowStockAlert: { path: "/webhook/inventory-events" },

    // INQUIRY/LEAD EVENTS WORKFLOW
    pcRequirementsSubmitted: { path: "/webhook/lead-events" },
    pcQuoteGenerated: { path: "/webhook/lead-events" },
    pcQuoteConfirmation: { path: "/webhook/lead-events" },
    pcRequirementsConfirmation: { path: "/webhook/lead-events" }
};