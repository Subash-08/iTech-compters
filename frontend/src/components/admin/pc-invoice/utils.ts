import { Product, Totals } from './types';

export const validateProduct = (product: Partial<Product>): boolean => {
  if (!product.name?.trim()) return false;
  if (typeof product.price !== 'number' || product.price < 0) return false;
  if (!Number.isInteger(product.quantity) || product.quantity < 1) return false;
  if (product.quantity > 1000) return false; // Reasonable limit
  return true;
};

export const calculateTotals = (products: Product[]): Totals => {
  const validProducts = products.filter(p => 
    p.name?.trim() && p.price > 0 && p.quantity > 0
  );
  
  const subtotal = validProducts.reduce((sum, product) => 
    sum + (product.price * product.quantity), 0
  );
  
  const tax = subtotal * 0.18; // 18% GST
  const grandTotal = subtotal + tax;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
};

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `INV-${timestamp}${random}`;
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

export const validateMobileNumber = (mobile: string): boolean => {
  return /^[0-9]{10}$/.test(mobile);
};

export const validatePrice = (price: number): boolean => {
  return price >= 0 && price <= 1000000; // Max 10 lakh
};