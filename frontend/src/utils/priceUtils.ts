// src/utils/priceUtils.ts

/**
 * Converts a tax-inclusive price back to its tax-exclusive base amount.
 * Example: 5000 inclusive @ 18% tax -> 4237.29 exclusive
 */
export const calculateExclusivePrice = (inclusive: number | undefined | null, taxRate: number | undefined | null): number => {
    if (!inclusive) return 0;
    if (!taxRate || taxRate <= 0) return inclusive;

    const exclusive = inclusive / (1 + taxRate / 100);
    // User explicitly requested rounding off to standard currency representation (2 decimals) in the DB
    return Math.round(exclusive * 100) / 100;
};

/**
 * Converts a tax-exclusive base amount to its tax-inclusive final price.
 * Example: 4237.29 exclusive @ 18% tax -> 5000 inclusive
 */
export const calculateInclusivePrice = (exclusive: number | undefined | null, taxRate: number | undefined | null): number => {
    if (!exclusive) return 0;
    if (!taxRate || taxRate <= 0) return exclusive;

    const inclusive = exclusive * (1 + taxRate / 100);
    const rounded = Math.round(inclusive * 100) / 100;

    // 🆕 Snap to integer if the fractional part is extremely close (e.g., .99 or .01)
    // This compensates for the 2-decimal precision loss in the DB for exact integer retail prices (like 81599)
    const integerPart = Math.round(rounded);
    if (Math.abs(rounded - integerPart) <= 0.02) {
        return integerPart;
    }

    return rounded;
};
