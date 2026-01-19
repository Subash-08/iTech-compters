export interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  total?: number;
}

export interface ProductItem {
  id: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  total?: number;
}

export interface InvoiceCalculatorData {
  invoiceNo: string;
  date: string;
  status: 'Generated' | 'Pending' | 'Paid';
  customerName: string;
  customerMobile: string;
  products: ProductItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

export interface InvoiceDetails {
  invoiceNo: string;
  date: string;
  status: 'Generated' | 'Pending' | 'Paid';
  customerName: string;
  customerMobile: string;
}

export interface Totals {
  subtotal: number;
  tax: number;
  grandTotal: number;
}

export interface CustomProductForm {
  name: string;
  price: string;
  quantity: number;
}

export const PRODUCT_CATEGORIES = [
  'Processor',
  'Motherboard',
  'Ram',
  'GPU',
  'SSD',
  'HDD',
  'Cooler',
  'SMPS',
  'Cabinet',
  'Printer',
  'Monitor',
  'Keyboard Mouse',
  'UPS',
  'Speaker',
  'Gaming Pad',
  'Headphones',
  'Wi-Fi Dongal',
  'CPU Fan',
  'External HDD',
  'Antivirus',
  'OS'
] as const;