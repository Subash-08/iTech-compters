/**
 * Tax Utility Functions
 * Centralizes all tax-related logic to ensure consistency across the application.
 *
 * STANDARD:
 * - Tax rates are stored and processed as PERCENTAGES (e.g., 18 for 18%).
 * - Tax amounts are calculated on the taxable amount (Subtotal - Discount).
 * - All monetary values should be rounded to 2 decimal places.
 *
 * CALCULATION FLOW:
 * 1. Subtotal = Sum(Item Price * Quantity)
 * 2. Taxable Amount = Subtotal - Discount
 * 3. Tax = Taxable Amount * (Tax Rate / 100)
 * 4. Total = Taxable Amount + Tax + Shipping
 */

/**
 * Normalizes a tax rate to a percentage format (e.g., 0.18 -> 18).
 * If the rate is < 1, it assumes it's a decimal and converts it.
 * If the rate is >= 1, it assumes it's already a percentage.
 * Default fallback is 18%.
 *
 * @param {number} rate - The tax rate input
 * @returns {number} - The tax rate as a percentage (e.g., 18)
 */
const normalizeTaxRate = (rate) => {
    if (rate === undefined || rate === null) return 18;

    const numericRate = Number(rate);

    if (isNaN(numericRate)) return 18;

    // If rate is clearly a decimal (e.g., 0.18), convert to percentage
    if (numericRate < 1 && numericRate > 0) {
        return numericRate * 100;
    }

    return numericRate;
};

/**
 * Calculates the tax amount for a given taxable amount.
 *
 * @param {number} amount - The taxable amount (e.g., price after discount)
 * @param {number} taxRate - The tax rate percentage (e.g., 18)
 * @returns {number} - The calculated tax amount, rounded to 2 decimals
 */
const calculateTaxAmount = (amount, taxRate) => {
    const rate = normalizeTaxRate(taxRate);
    const tax = amount * (rate / 100);
    return Math.round(tax * 100) / 100;
};

/**
 * Calculates the price inclusive of tax.
 * Useful for displaying "MRP" or "Price with Tax" on frontend.
 *
 * @param {number} amount - The base price (tax-exclusive)
 * @param {number} taxRate - The tax rate percentage
 * @returns {number} - The total price including tax
 */
const calculatePriceWithTax = (amount, taxRate) => {
    const tax = calculateTaxAmount(amount, taxRate);
    return Math.round((amount + tax) * 100) / 100;
};

/**
 * Calculates a full tax breakdown for a transaction.
 * Follows the logic: Taxable = Subtotal - Discount.
 *
 * @param {number} subtotal - The sum of base prices
 * @param {number} discount - The total discount amount
 * @param {number} taxRate - The tax rate percentage
 * @param {number} shipping - Shipping cost (optional, default 0)
 * @returns {object} - Structured breakdown including taxableAmount, tax, total
 */
const calculateTaxBreakdown = (subtotal, discount, taxRate, shipping = 0) => {
    const rate = normalizeTaxRate(taxRate);

    // Ensure non-negative values
    const safeSubtotal = Math.max(0, subtotal);
    const safeShipping = Math.max(0, shipping);

    // 1. Calculate Taxable Amount (do NOT subtract discount to keep tax unchanged)
    const taxableAmount = safeSubtotal;

    // 2. Calculate Tax
    const tax = calculateTaxAmount(taxableAmount, rate);

    // Gross Total before discount
    const grossTotal = taxableAmount + tax + safeShipping;

    // Cap discount against grossTotal instead of subtotal
    const safeDiscount = Math.round(
        Math.min(grossTotal, Math.max(0, discount)) * 100
    ) / 100;

    // 3. Calculate Final Total
    // Total = grossTotal - Discount
    const total = grossTotal - safeDiscount;

    return {
        subtotal: Math.round(safeSubtotal * 100) / 100,
        discount: Math.round(safeDiscount * 100) / 100,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        taxRate: rate,
        tax: tax,
        shipping: Math.round(safeShipping * 100) / 100,
        total: Math.round(total * 100) / 100
    };
};

/**
 * Calculates aggregate tax breakdown using each item's own taxRate.
 *
 * INVARIANT (MUST be enforced by caller):
 *   items[i].total MUST be pre-discount AND tax-exclusive (i.e., sellingPrice * qty).
 *   If discountedPrice was used to build items[i].total, this function will
 *   silently double-discount. Never pass post-discount totals here.
 *
 * ROUNDING STRATEGY (Option A):
 *   Per-item discount and per-item tax are both rounded before accumulation.
 *   This ensures consistency with any per-item display (e.g., invoice line items).
 *
 * FREE_SHIPPING COUPONS:
 *   For free_shipping coupon type, discountAmount = 0 and shippingAfterDiscount = 0.
 *   The caller is responsible for reducing shipping to 0 before calling this function.
 *
 * @param {Array}  items                - Cart items: each must have { total (pre-discount, tax-excl), taxRate (%) }
 * @param {number} discountAmount       - Coupon discount on line items (0 for free_shipping type)
 * @param {number} shippingAfterDiscount - Shipping cost already reduced by free_shipping coupon
 * @returns {object} { subtotal, discount, tax, shipping, total }
 */
const calculateItemLevelTaxBreakdown = (items = [], discountAmount = 0, shippingAfterDiscount = 0) => {
    const subtotal = Math.round(
        items.reduce((s, i) => s + (Number(i.total) || 0), 0) * 100
    ) / 100;

    const safeShipping = Math.max(0, Number(shippingAfterDiscount) || 0);

    // Calculate tax on the full pre-discount item total
    const tax = items.reduce((acc, item) => {
        const itemTotal = Number(item.total) || 0;
        const taxableAmount = itemTotal; // Do NOT subtract discount here
        // Round per-item tax before summing (Option A)
        const itemTaxRounded = Math.round(calculateTaxAmount(taxableAmount, item.taxRate) * 100) / 100;
        return acc + itemTaxRounded;
    }, 0);

    const taxRounded = Math.round(tax * 100) / 100;

    // Calculate gross total before discount (Rule: total = subtotal + tax + shipping)
    const total = Math.round((subtotal + taxRounded + safeShipping) * 100) / 100;

    // Cap discount against total instead of subtotal
    const safeDiscount = Math.round(
        Math.min(total, Math.max(0, Number(discountAmount) || 0)) * 100
    ) / 100;

    // amountDue = total - discount
    const amountDue = Math.round(
        (total - safeDiscount) * 100
    ) / 100;

    return {
        subtotal,
        discount: safeDiscount,
        tax: taxRounded,
        shipping: Math.round(safeShipping * 100) / 100,
        total, // Total before discount
        amountDue // Amount for payment
    };
};

module.exports = {
    normalizeTaxRate,
    calculateTaxAmount,
    calculatePriceWithTax,
    calculateTaxBreakdown,
    calculateItemLevelTaxBreakdown
};
